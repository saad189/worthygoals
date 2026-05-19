import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { format, addHours } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { NotificationLog } from 'src/database/models/notification-log.entity';
import { PushToken } from 'src/database/models/push-token.entity';
import { Repository } from 'typeorm';
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
