import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Optional } from '@nestjs/common';
import { Job } from 'bullmq';
import Expo from 'expo-server-sdk';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationVoicingService } from './notification-voicing.service';
import { PersonalityService } from 'src/core/personalities/personality.service';
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
    @Optional() private readonly voicingService?: NotificationVoicingService,
    @Optional() private readonly personalityService?: PersonalityService,
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

    const body = await this.resolveBody(userId, kind, job.data.payload);

    const messages = tokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map((t) => ({
        to: t.token,
        title: 'Evolve',
        body,
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
        this.logger.error(
          `Push send failed for user ${userId}: ${err.message}`,
        );
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

  private async resolveBody(
    userId: number,
    kind: NotificationJobData['kind'],
    payload?: Record<string, unknown>,
  ): Promise<string> {
    if (!this.voicingService || !this.personalityService) {
      return this.fallbackBody(kind);
    }

    try {
      const userPersonality =
        await this.personalityService.getUserPersonality(userId);
      if (!userPersonality?.personalityId) return this.fallbackBody(kind);

      const context: Record<string, unknown> = payload ?? {};
      const { body } = await this.voicingService.getOrGenerateCopy(
        userPersonality.personalityId,
        kind,
        context,
      );
      return body;
    } catch (err: any) {
      this.logger.warn(
        `Voicing failed for user ${userId}/${kind}: ${err?.message}. Using fallback.`,
      );
      return this.fallbackBody(kind);
    }
  }

  private fallbackBody(kind: NotificationJobData['kind']): string {
    const bodies: Record<NotificationJobData['kind'], string> = {
      morning_setup: 'Good morning — your mentor is ready.',
      evening_check_in: 'How did today go?',
      task_due: 'A task is waiting for you.',
      weekly_review: 'Time for your weekly reflection.',
      re_engage: "Your mentor hasn't heard from you in a while.",
    };
    return bodies[kind] ?? 'You have a new message.';
  }
}
