import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Optional } from '@nestjs/common';
import { Job } from 'bullmq';
import Expo, { ExpoPushTicket } from 'expo-server-sdk';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationVoicingService } from './notification-voicing.service';
import { UsersService } from 'src/modules/users/users.service';
import {
  NOTIFICATION_QUEUE,
  NotificationJobData,
  NotificationQueueData,
  PUSH_RECEIPTS_JOB,
  PushReceiptJobData,
} from './types/notification-job.types';

// Expo publishes receipts within ~15 minutes of a ticket and keeps them for a
// day; checking at 15 min is their recommended cadence.
const RECEIPT_DELAY_MS = 15 * 60 * 1000;

@Processor(NOTIFICATION_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);
  private readonly expo: Expo;

  constructor(
    private readonly notifService: NotificationsService,
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
    @InjectQueue(NOTIFICATION_QUEUE)
    private readonly queue: Queue<NotificationQueueData>,
    @Optional() private readonly voicingService?: NotificationVoicingService,
  ) {
    super();
    this.expo = new Expo({
      accessToken: config.get<string>('EXPO_ACCESS_TOKEN'),
    });
  }

  async process(job: Job<NotificationQueueData>): Promise<void> {
    if (job.name === PUSH_RECEIPTS_JOB) {
      return this.checkReceipts(job.data as PushReceiptJobData);
    }
    return this.send(job as Job<NotificationJobData>);
  }

  private async send(job: Job<NotificationJobData>): Promise<void> {
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
    const accepted: PushReceiptJobData['tickets'] = [];
    for (const chunk of chunks) {
      // A thrown send (network, Expo 5xx) propagates so BullMQ retries the job
      // with backoff. It used to be caught and logged, which completed the job
      // green with nothing delivered — and there was no retry policy anyway.
      const tickets = await this.expo.sendPushNotificationsAsync(chunk);
      for (let i = 0; i < tickets.length; i++) {
        // chunk[i], not messages[i]: past the first chunk the two diverge and
        // every status was recorded against the wrong token.
        const token = chunk[i].to as string;
        const ticket = tickets[i];
        await this.handleTicket(ticket, token);
        await this.notifService.recordSent(
          userId,
          kind,
          tz,
          token,
          ticket.status === 'ok' ? 'sent' : 'error',
        );
        if (ticket.status === 'ok') accepted.push({ id: ticket.id, token });
      }
    }

    // A ticket only means Expo accepted the message. Whether it reached the
    // device is in the receipt, which nothing ever read.
    if (accepted.length) {
      await this.queue.add(
        PUSH_RECEIPTS_JOB,
        { tickets: accepted },
        { delay: RECEIPT_DELAY_MS },
      );
    }
  }

  private async handleTicket(
    ticket: ExpoPushTicket,
    token: string,
  ): Promise<void> {
    if (ticket.status === 'ok') return;
    this.logger.warn(`Push ticket error for ${token}: ${ticket.message}`);
    if (ticket.details?.error === 'DeviceNotRegistered') {
      await this.notifService.deactivateToken(token);
    }
  }

  private async checkReceipts({ tickets }: PushReceiptJobData): Promise<void> {
    const tokenById = new Map(tickets.map((t) => [t.id, t.token]));
    const idChunks = this.expo.chunkPushNotificationReceiptIds([
      ...tokenById.keys(),
    ]);
    for (const ids of idChunks) {
      const receipts = await this.expo.getPushNotificationReceiptsAsync(ids);
      for (const [id, receipt] of Object.entries(receipts)) {
        if (receipt.status === 'ok') continue;
        const token = tokenById.get(id);
        this.logger.warn(
          `Push receipt error for ${token}: ${receipt.details?.error ?? receipt.message}`,
        );
        if (token && receipt.details?.error === 'DeviceNotRegistered') {
          await this.notifService.deactivateToken(token);
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
      // users.personalityId. This used to read user_personalities, whose only
      // writer was never called, so every push shipped the generic fallback.
      // That table is dropped (DropUserPersonalities1769800000000).
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
