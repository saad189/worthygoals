import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Optional } from '@nestjs/common';
import { Job } from 'bullmq';
import Expo from 'expo-server-sdk';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationVoicingService } from './notification-voicing.service';
import { UsersService } from 'src/modules/users/users.service';
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
    private readonly usersService: UsersService,
    @Optional() private readonly voicingService?: NotificationVoicingService,
  ) {
    super();
    this.expo = new Expo({
      accessToken: config.get<string>('EXPO_ACCESS_TOKEN'),
    });
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    const { userId, kind, scheduledFor } = job.data;

    const tokens = await this.notifService.getTokens(userId);
    if (!tokens.length) {
      // Returning silently here is why token registration being broken went
      // unnoticed for two months: the queue drained green while sending
      // nothing at all.
      this.logger.warn(
        `No active push tokens for user ${userId} — dropping ${kind}. ` +
          'The device has not registered, or registration is failing.',
      );
      return;
    }

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
        title: 'Worthy Goals',
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
    if (!this.voicingService) {
      return this.fallbackBody(kind);
    }

    try {
      // users.personalityId, not user_personalities. The latter's only writer,
      // setUserPersonality, has zero callers in the monorepo and the table is
      // empty, so this lookup always returned null and every push shipped the
      // generic fallback — the whole voicing pipeline was unreachable.
      const user = await this.usersService.findOne(userId);
      if (!user?.personalityId) {
        this.logger.debug(
          `User ${userId} has no personalityId — using fallback copy for ${kind}`,
        );
        return this.fallbackBody(kind);
      }

      const context: Record<string, unknown> = payload ?? {};
      const { body } = await this.voicingService.getOrGenerateCopy(
        user.personalityId,
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
