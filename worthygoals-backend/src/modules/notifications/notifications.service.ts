import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { format, addHours, subDays } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { NotificationLog } from 'src/database/models/notification-log.entity';
import { PushToken } from 'src/database/models/push-token.entity';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { RegisterTokenDto } from './dto/register-token.dto';
import {
  NOTIFICATION_QUEUE,
  NotificationJobData,
  NotificationJobKind,
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

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(PushToken)
    private readonly tokenRepo: Repository<PushToken>,
    @InjectRepository(NotificationLog)
    private readonly logRepo: Repository<NotificationLog>,
    @InjectQueue(NOTIFICATION_QUEUE)
    private readonly notifQueue: Queue<NotificationJobData>,
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

  async getTokens(userId: number): Promise<PushToken[]> {
    return this.tokenRepo.find({ where: { userId, active: true } });
  }

  async materializeNext24h(): Promise<void> {
    const tokens = await this.tokenRepo.find({ where: { active: true } });
    const nowUtc = new Date();

    for (const tokenRow of tokens) {
      const tz = tokenRow.timezone ?? 'UTC';
      try {
        await this.scheduleForUser(tokenRow.userId, tz, nowUtc);
      } catch (err) {
        this.logger.warn(
          `Failed to schedule for user ${tokenRow.userId}: ${err.message}`,
        );
      }
    }
  }

  private async scheduleForUser(
    userId: number,
    tz: string,
    nowUtc: Date,
  ): Promise<void> {
    const nowLocal = toZonedTime(nowUtc, tz);
    const windowEnd = addHours(nowLocal, 25);

    for (const slot of DAILY_SCHEDULE) {
      const candidate = new Date(nowLocal);
      candidate.setHours(slot.localHour, 0, 0, 0);

      if (candidate <= nowLocal) {
        candidate.setDate(candidate.getDate() + 1);
      }

      if (candidate > windowEnd) continue;

      const jobId = `${userId}:${slot.kind}:${format(candidate, 'yyyy-MM-dd')}`;
      const existing = await this.notifQueue.getJob(jobId);
      if (existing) continue;

      const delayMs = fromZonedTime(candidate, tz).getTime() - Date.now();
      if (delayMs < 0) continue;

      const data: NotificationJobData = {
        userId,
        kind: slot.kind,
        scheduledFor: candidate.toISOString(),
      };

      await this.notifQueue.add(slot.kind, data, {
        jobId,
        delay: delayMs,
        removeOnComplete: true,
        removeOnFail: 100,
      });
    }
  }

  /**
   * Find users who went quiet — no completion, explanation, status post, or
   * chat message for LAPSE_DAYS+ — and enqueue one voiced `re_engage` push at
   * the next LAPSE_LOCAL_HOUR in their timezone. Users who were never active
   * are skipped (that's an onboarding-funnel problem, not a lapse), and a
   * re_engage sent in the last LAPSE_RESEND_DAYS suppresses the next one.
   */
  async scheduleLapseReEngagement(): Promise<void> {
    const tokens = await this.tokenRepo.find({ where: { active: true } });
    if (!tokens.length) return;

    const tzByUser = new Map<number, string>();
    for (const t of tokens) {
      if (!tzByUser.has(t.userId)) tzByUser.set(t.userId, t.timezone ?? 'UTC');
    }
    const userIds = [...tzByUser.keys()];

    // Last activity per user across every surface that counts as "showing up".
    const rows: Array<{ userId: number; lastTs: string | null }> =
      await this.logRepo.manager.query(
        `
        SELECT a."userId" AS "userId", MAX(a.ts) AS "lastTs"
        FROM (
          SELECT m."userId" AS "userId", m."createdAt" AS ts
            FROM messages m
           WHERE m.role = 'user' AND m."userId" IS NOT NULL
          UNION ALL
          SELECT p."userId", p."createdAt" FROM status_posts p
          UNION ALL
          SELECT g."userId", c."createdAt"
            FROM task_completions c
            JOIN tasks t ON t.id = c."taskId"
            JOIN goals g ON g.id = t."goalId"
          UNION ALL
          SELECT g."userId", e."createdAt"
            FROM task_explanations e
            JOIN tasks t ON t.id = e."taskId"
            JOIN goals g ON g.id = t."goalId"
        ) a
        WHERE a."userId" = ANY($1)
        GROUP BY a."userId"
        `,
        [userIds],
      );

    const now = Date.now();
    for (const row of rows) {
      if (!row.lastTs) continue;
      const daysSince = Math.floor(
        (now - new Date(row.lastTs).getTime()) / (24 * 60 * 60 * 1000),
      );
      if (daysSince < LAPSE_DAYS) continue;

      const tz = tzByUser.get(row.userId) ?? 'UTC';

      // Weekly cadence guard — sentDate is yyyy-MM-dd, so string >= compares.
      const resendFloor = format(
        toZonedTime(subDays(new Date(), LAPSE_RESEND_DAYS), tz),
        'yyyy-MM-dd',
      );
      const recent = await this.logRepo.count({
        where: {
          userId: row.userId,
          kind: 're_engage',
          sentDate: MoreThanOrEqual(resendFloor),
        },
      });
      if (recent > 0) continue;

      // Next LAPSE_LOCAL_HOUR in the user's timezone, same dedupe pattern as
      // the daily slots.
      const nowLocal = toZonedTime(new Date(), tz);
      const candidate = new Date(nowLocal);
      candidate.setHours(LAPSE_LOCAL_HOUR, 0, 0, 0);
      if (candidate <= nowLocal) candidate.setDate(candidate.getDate() + 1);

      const jobId = `${row.userId}:re_engage:${format(candidate, 'yyyy-MM-dd')}`;
      const existing = await this.notifQueue.getJob(jobId);
      if (existing) continue;

      const delayMs = fromZonedTime(candidate, tz).getTime() - Date.now();
      if (delayMs < 0) continue;

      await this.notifQueue.add(
        're_engage',
        {
          userId: row.userId,
          kind: 're_engage',
          scheduledFor: candidate.toISOString(),
          payload: { daysSince },
        },
        { jobId, delay: delayMs, removeOnComplete: true, removeOnFail: 100 },
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
