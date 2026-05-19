import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import Expo from 'expo-server-sdk';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import {
  NOTIFICATION_QUEUE,
  NotificationJobData,
} from './types/notification-job.types';

@Processor(NOTIFICATION_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);
  private readonly expo: Expo;

  constructor(
    private readonly notifService: NotificationsService,
    private readonly config: ConfigService,
  ) {
    super();
    this.expo = new Expo({
      accessToken: config.get<string>('EXPO_ACCESS_TOKEN'),
    });
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    const { userId, kind, scheduledFor } = job.data;

    const tokens = await this.notifService.getTokens(userId);
    if (!tokens.length) return;

    const tz = tokens[0].timezone ?? 'UTC';
    const allowed = await this.notifService.checkPacingAllowed(userId, tz);
    if (!allowed) {
      this.logger.debug(`User ${userId} hit daily cap — dropping ${kind}`);
      return;
    }

    const messages = tokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map((t) => ({
        to: t.token,
        title: 'Evolve',
        body: this.placeholderBody(kind),
        data: { kind, scheduledFor },
      }));

    if (!messages.length) return;

    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const receipts = await this.expo.sendPushNotificationsAsync(chunk);
        for (let i = 0; i < receipts.length; i++) {
          const receipt = receipts[i];
          const token = messages[i].to;
          const status = receipt.status === 'ok' ? 'sent' : 'error';
          await this.notifService.recordSent(userId, kind, tz, token, status);
        }
      } catch (err) {
        this.logger.error(`Push send failed for user ${userId}: ${err.message}`);
        for (const msg of chunk) {
          await this.notifService.recordSent(
            userId,
            kind,
            tz,
            msg.to as string,
            'error',
          );
        }
      }
    }
  }

  private placeholderBody(kind: NotificationJobData['kind']): string {
    const bodies: Record<NotificationJobData['kind'], string> = {
      morning_setup: "Good morning — your mentor is ready.",
      evening_check_in: "How did today go?",
      task_due: "A task is waiting for you.",
      weekly_review: "Time for your weekly reflection.",
      re_engage: "Your mentor hasn't heard from you in a while.",
    };
    return bodies[kind] ?? "You have a new message.";
  }
}
