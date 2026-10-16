import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { format, addHours, subDays } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { NotificationLog } from 'src/database/models/notification-log.entity';
import { PushToken } from 'src/database/models/push-token.entity';
import { Repository } from 'typeorm';
import { RegisterTokenDto } from './dto/register-token.dto';
import {
  NOTIFICATION_QUEUE,
  NotificationJobData,
  NotificationJobKind,
  NotificationQueueData,
} from './types/notification-job.types';

const DAILY_CAP = 3;

const DAILY_SCHEDULE: Array<{ kind: NotificationJobKind; localHour: number }> =
  [
    { kind: 'morning_setup', localHour: 8 },
    { kind: 'evening_check_in', localHour: 20 },
  ];

// Lapse re-engagement (PRD 9.4): after 3+ quiet days the next push must be
// in-character and shame-free. One push when the lapse is detected, then at
// most one a week — never a daily drumbeat at someone who left.
const LAPSE_DAYS = 3;
const LAPSE_RESEND_DAYS = 7;
const LAPSE_LOCAL_HOUR = 11;
const LAPSE_GIVE_UP_DAYS = 90;

const DAY_MS = 24 * 60 * 60 * 1000;
const USER_PAGE_SIZE = 500;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(PushToken)
    private readonly tokenRepo: Repository<PushToken>,
    @InjectRepository(NotificationLog)
    private readonly logRepo: Repository<NotificationLog>,
    @InjectQueue(NOTIFICATION_QUEUE)
    private readonly notifQueue: Queue<NotificationQueueData>,
  ) {}

  async registerToken(userId: number, dto: RegisterTokenDto): Promise<void> {
    await this.tokenRepo.upsert(
      {
        userId,
        token: dto.token,
        platform: dto.platform ?? 'expo',
        timezone: dto.timezone ?? 'UTC',
        active: true,
      },
      ['userId', 'token'],
    );
  }

  async unregisterToken(userId: number, token: string): Promise<void> {
    await this.tokenRepo.update({ userId, token }, { active: false });
  }

  /**
   * Retire a token Expo reports as DeviceNotRegistered (app uninstalled or
   * the token rotated). Until receipts were read, the only path that ever set
   * active=false was the unregister route, so dead tokens were pushed to
   * forever.
   */
  async deactivateToken(token: string): Promise<void> {
    await this.tokenRepo.update({ token }, { active: false });
  }

  async getTokens(userId: number): Promise<PushToken[]> {
    return this.tokenRepo.find({ where: { userId, active: true } });
  }

  /**
   * Active tokens, one row per user, in keyset-paginated pages.
   *
   * The crons used to load every active token table-wide in one query and
   * then walk it with serial Redis round-trips per slot. Paging by userId keeps
   * memory flat as the user count grows. A user's first token's timezone
   * wins — the same choice the processor makes.
   */
  private async *activeUserPages(): AsyncGenerator<
    Array<{ userId: number; timezone: string }>
  > {
    let afterUserId = -1;
    for (;;) {
      const page: Array<{ userId: number; timezone: string | null }> =
        await this.tokenRepo.manager.query(
          `
          SELECT DISTINCT ON ("userId") "userId", timezone
            FROM push_tokens
           WHERE active = true AND "userId" > $1
           ORDER BY "userId", "createdAt"
           LIMIT $2
          `,
          [afterUserId, USER_PAGE_SIZE],
        );
      if (!page.length) return;
      yield page.map((r) => ({
        userId: r.userId,
        timezone: r.timezone ?? 'UTC',
      }));
      if (page.length < USER_PAGE_SIZE) return;
      afterUserId = page[page.length - 1].userId;
    }
  }

  async materializeNext24h(): Promise<void> {
    const nowUtc = new Date();

    for await (const users of this.activeUserPages()) {
      const jobs = users.flatMap(({ userId, timezone }) =>
        this.dailyJobsForUser(userId, timezone, nowUtc),
      );
      if (!jobs.length) continue;
      try {
        // A jobId BullMQ already holds is ignored, which is what makes this
        // hourly cron idempotent — the per-slot getJob() round-trip it used to
        // make first was redundant.
        await this.notifQueue.addBulk(jobs);
      } catch (err) {
        this.logger.error(
          `Failed to schedule a page of ${users.length} users: ${err.message}`,
        );
      }
    }
  }

  private dailyJobsForUser(userId: number, tz: string, nowUtc: Date) {
    const nowLocal = toZonedTime(nowUtc, tz);
    const windowEnd = addHours(nowLocal, 25);
    const jobs: Array<{
      name: NotificationJobKind;
      data: NotificationJobData;
      opts: { jobId: string; delay: number };
    }> = [];

    for (const slot of DAILY_SCHEDULE) {
      const candidate = new Date(nowLocal);
      candidate.setHours(slot.localHour, 0, 0, 0);

      if (candidate <= nowLocal) {
        candidate.setDate(candidate.getDate() + 1);
      }

      if (candidate > windowEnd) continue;

      // candidate holds local wall-clock fields; its own toISOString() is off by
      // the server-vs-user tz skew. fromZonedTime gives the true UTC instant.
      const scheduledUtc = fromZonedTime(candidate, tz);
      const delayMs = scheduledUtc.getTime() - Date.now();
      if (delayMs < 0) continue;

      jobs.push({
        name: slot.kind,
        data: {
          userId,
          kind: slot.kind,
          scheduledFor: scheduledUtc.toISOString(),
        },
        opts: {
          jobId: `${userId}:${slot.kind}:${format(candidate, 'yyyy-MM-dd')}`,
          delay: delayMs,
        },
      });
    }
    return jobs;
  }

  /**
   * Find users who went quiet — no completion, explanation, status post, or
   * chat message for LAPSE_DAYS+ — and enqueue one voiced `re_engage` push at
   * the next LAPSE_LOCAL_HOUR in their timezone. Users who were never active
   * are skipped (that's an onboarding-funnel problem, not a lapse), and a
   * re_engage sent in the last LAPSE_RESEND_DAYS suppresses the next one.
   */
  async scheduleLapseReEngagement(): Promise<void> {
    for await (const users of this.activeUserPages()) {
      await this.scheduleLapseForPage(users);
    }
  }

  private async scheduleLapseForPage(
    users: Array<{ userId: number; timezone: string }>,
  ): Promise<void> {
    const tzByUser = new Map(users.map((u) => [u.userId, u.timezone]));
    const userIds = [...tzByUser.keys()];

    // Last activity per user across every surface that counts as "showing up".
    // Bounded to LAPSE_GIVE_UP_DAYS: this ran over all of history every tick,
    // and someone silent for that long has left — the PRD's rule is no drumbeat
    // at people who left.
    const rows: Array<{ userId: number; lastTs: string | null }> =
      await this.logRepo.manager.query(
        `
        SELECT a."userId" AS "userId", MAX(a.ts) AS "lastTs"
        FROM (
          SELECT m."userId" AS "userId", m."createdAt" AS ts
            FROM messages m
           WHERE m.role = 'user' AND m."userId" = ANY($1) AND m."createdAt" >= $2
          UNION ALL
          SELECT p."userId", p."createdAt" FROM status_posts p
           WHERE p."userId" = ANY($1) AND p."createdAt" >= $2
          UNION ALL
          SELECT g."userId", c."createdAt"
            FROM task_completions c
            JOIN tasks t ON t.id = c."taskId"
            JOIN goals g ON g.id = t."goalId"
           WHERE g."userId" = ANY($1) AND c."createdAt" >= $2
          UNION ALL
          SELECT g."userId", e."createdAt"
            FROM task_explanations e
            JOIN tasks t ON t.id = e."taskId"
            JOIN goals g ON g.id = t."goalId"
           WHERE g."userId" = ANY($1) AND e."createdAt" >= $2
        ) a
        GROUP BY a."userId"
        `,
        [userIds, subDays(new Date(), LAPSE_GIVE_UP_DAYS)],
      );

    const lapsed = rows.filter(
      (r) =>
        r.lastTs &&
        Date.now() - new Date(r.lastTs).getTime() >= LAPSE_DAYS * DAY_MS,
    );
    if (!lapsed.length) return;

    // Weekly cadence guard, one query for the page instead of a count per user.
    // The floor is taken in UTC; the one-day timezone slop is immaterial
    // against a seven-day window.
    const recentlyNudged: Array<{ userId: number }> =
      await this.logRepo.manager.query(
        `
        SELECT DISTINCT "userId" FROM notification_logs
         WHERE kind = 're_engage' AND "userId" = ANY($1) AND "sentDate" >= $2
        `,
        [
          lapsed.map((r) => r.userId),
          format(subDays(new Date(), LAPSE_RESEND_DAYS), 'yyyy-MM-dd'),
        ],
      );
    const suppressed = new Set(recentlyNudged.map((r) => r.userId));

    for (const row of lapsed) {
      if (suppressed.has(row.userId)) continue;

      const tz = tzByUser.get(row.userId) ?? 'UTC';
      const daysSince = Math.floor(
        (Date.now() - new Date(row.lastTs as string).getTime()) / DAY_MS,
      );

      // Next LAPSE_LOCAL_HOUR in the user's timezone. Same jobId dedupe as
      // the daily slots — BullMQ ignores a jobId it already holds.
      const nowLocal = toZonedTime(new Date(), tz);
      const candidate = new Date(nowLocal);
      candidate.setHours(LAPSE_LOCAL_HOUR, 0, 0, 0);
      if (candidate <= nowLocal) candidate.setDate(candidate.getDate() + 1);

      const scheduledUtc = fromZonedTime(candidate, tz);
      const delayMs = scheduledUtc.getTime() - Date.now();
      if (delayMs < 0) continue;

      await this.notifQueue.add(
        're_engage',
        {
          userId: row.userId,
          kind: 're_engage',
          scheduledFor: scheduledUtc.toISOString(),
          payload: { daysSince },
        },
        {
          jobId: `${row.userId}:re_engage:${format(candidate, 'yyyy-MM-dd')}`,
          delay: delayMs,
        },
      );
    }
  }

  async checkPacingAllowed(userId: number, tz: string): Promise<boolean> {
    const todayLocal = format(toZonedTime(new Date(), tz), 'yyyy-MM-dd');
    const count = await this.logRepo.count({
      where: { userId, sentDate: todayLocal },
    });
    return count < DAILY_CAP;
  }

  async recordSent(
    userId: number,
    kind: NotificationJobKind,
    tz: string,
    token: string,
    status = 'sent',
  ): Promise<void> {
    const sentDate = format(toZonedTime(new Date(), tz), 'yyyy-MM-dd');
    await this.logRepo.save({ userId, kind, sentDate, token, status });
  }
}
