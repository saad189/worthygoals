import { localDay, safeTimeZone } from 'src/common/timezone';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { format, addHours, subDays } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { NotificationLog } from 'src/database/models/notification-log.entity';
import { PushToken } from 'src/database/models/push-token.entity';
import { Not, Repository } from 'typeorm';
import { RegisterTokenDto } from './dto/register-token.dto';
import {
  NOTIFICATION_QUEUE,
  NotificationJobData,
  NotificationJobKind,
  NotificationQueueData,
} from './types/notification-job.types';

const DAILY_CAP = 3;

// The evening slot goes out as `task_due` while today's tasks are still open
// (the processor decides at send time). Sunday adds the weekly review, which
// keeps the busiest day at DAILY_CAP.
const DAILY_SCHEDULE: Array<{
  kind: NotificationJobKind;
  localHour: number;
  /** Only on this local weekday (0 = Sunday). */
  weekday?: number;
}> = [
  { kind: 'morning_setup', localHour: 8 },
  { kind: 'weekly_review', localHour: 18, weekday: 0 },
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
    // A device token belongs to whoever signed in last. Without this, user A's
    // row stayed active after user B signed in on the same phone, and A's
    // pushes landed on B's device.
    await this.tokenRepo.update(
      { token: dto.token, userId: Not(userId) },
      { active: false },
    );
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
    // users.timezone is the one zone every "today" uses; a registering device
    // is a fresh reading of it.
    if (dto.timezone) {
      await this.tokenRepo.manager.query(
        `UPDATE users SET timezone = $1 WHERE id = $2 AND timezone <> $1`,
        [dto.timezone, userId],
      );
    }
  }

  /**
   * The user's work today, in their own day, on active goals only — what
   * decides whether a push has anything to say.
   */
  async todayWork(
    userId: number,
    tz: string,
  ): Promise<{ activeGoals: number; total: number; pending: number }> {
    const [row] = await this.tokenRepo.manager.query(
      `
      SELECT (SELECT count(*) FROM goals
               WHERE "userId" = $1 AND status = 'active')::int AS "activeGoals",
             count(t.id)::int AS total,
             (count(t.id) FILTER (WHERE t.status = 'pending'))::int AS pending
        FROM tasks t
        JOIN goals g ON g.id = t."goalId"
       WHERE g."userId" = $1 AND g.status = 'active' AND t."dueOn" = $2
      `,
      [userId, localDay(tz)],
    );
    return row;
  }

  /** The user's zone — what the processor's pacing and quiet hours use. */
  async userTimezone(userId: number): Promise<string> {
    const [row] = await this.tokenRepo.manager.query(
      `SELECT timezone FROM users WHERE id = $1`,
      [userId],
    );
    return safeTimeZone(row?.timezone);
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
   * memory flat as the user count grows. The zone is users.timezone — the
   * one the app keeps current — not a token's, which is only as fresh as the
   * device's last registration.
   */
  private async *activeUserPages(): AsyncGenerator<
    Array<{ userId: number; timezone: string }>
  > {
    let afterUserId = -1;
    for (;;) {
      const page: Array<{ userId: number; timezone: string | null }> =
        await this.tokenRepo.manager.query(
          `
          SELECT DISTINCT ON (pt."userId") pt."userId", u.timezone
            FROM push_tokens pt
            JOIN users u ON u.id = pt."userId"
           WHERE pt.active = true AND pt."userId" > $1
           ORDER BY pt."userId"
           LIMIT $2
          `,
          [afterUserId, USER_PAGE_SIZE],
        );
      if (!page.length) return;
      yield page.map((r) => ({
        userId: r.userId,
        timezone: safeTimeZone(r.timezone),
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
      // candidate holds the user's local wall-clock fields, so getDay() is
      // their weekday.
      if (slot.weekday !== undefined && candidate.getDay() !== slot.weekday) {
        continue;
      }

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

      const tz = safeTimeZone(tzByUser.get(row.userId));
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

  // The cap is notifications per day, not log rows: recordSent writes one row
  // per token, so counting rows let a user with three devices receive only the
  // morning push.
  async checkPacingAllowed(userId: number, tz: string): Promise<boolean> {
    const todayLocal = format(toZonedTime(new Date(), tz), 'yyyy-MM-dd');
    const row = await this.logRepo
      .createQueryBuilder('l')
      .select('COUNT(DISTINCT l.kind)', 'n')
      .where('l.userId = :userId', { userId })
      .andWhere('l.sentDate = :todayLocal', { todayLocal })
      .andWhere("l.status = 'sent'")
      .getRawOne<{ n: string }>();
    return Number(row?.n ?? 0) < DAILY_CAP;
  }

  /** Tokens this kind already reached today, so a retried job doesn't re-push them. */
  async tokensSentToday(
    userId: number,
    kind: NotificationJobKind,
    tz: string,
  ): Promise<Set<string>> {
    const sentDate = format(toZonedTime(new Date(), tz), 'yyyy-MM-dd');
    const rows = await this.logRepo.find({
      select: { token: true },
      where: { userId, kind, sentDate, status: 'sent' },
    });
    return new Set(rows.map((r) => r.token));
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
