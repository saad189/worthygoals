import * as crypto from 'crypto';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { format } from 'date-fns';
import { NotificationCopyCache } from 'src/database/models/notification-copy-cache.entity';
import { PersonalityService } from 'src/core/personalities/personality.service';
import { OpenAiProvider } from 'src/core/ai/gateway/openai.provider';
import { NotificationJobKind } from './types/notification-job.types';

const KIND_TO_EVENT: Record<NotificationJobKind, string> = {
  morning_setup: 'notification.morning_setup',
  evening_check_in: 'notification.evening_check_in',
  re_engage: 'notification.re_engage',
  task_due: 'notification.task_due',
  weekly_review: 'notification.weekly_review',
};

const FALLBACK_BODIES: Record<NotificationJobKind, string> = {
  morning_setup: 'Good morning — your goals are waiting.',
  evening_check_in: 'How did today go?',
  re_engage: "Your mentor hasn't heard from you in a while.",
  task_due: 'A task is waiting for you.',
  weekly_review: 'Time for your weekly reflection.',
};

function hashContext(context: Record<string, unknown>): string {
  const sorted = Object.keys(context)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = context[k];
      return acc;
    }, {});
  return crypto
    .createHash('md5')
    .update(JSON.stringify(sorted))
    .digest('hex')
    .slice(0, 16);
}

@Injectable()
export class NotificationVoicingService {
  private readonly logger = new Logger(NotificationVoicingService.name);

  constructor(
    @InjectRepository(NotificationCopyCache)
    private readonly cacheRepo: Repository<NotificationCopyCache>,
    private readonly personalityService: PersonalityService,
    @Optional() private readonly openAiProvider?: OpenAiProvider,
  ) {}

  async getOrGenerateCopy(
    personalityId: string,
    kind: NotificationJobKind,
    context: Record<string, unknown> = {},
  ): Promise<{ body: string; abVariant: string }> {
    const event = KIND_TO_EVENT[kind];
    const day = format(new Date(), 'yyyy-MM-dd');
    const contextHash = hashContext(context);

    const cached = await this.cacheRepo.findOne({
      where: { personalityId, event, day, contextHash },
    });
    if (cached) return { body: cached.body, abVariant: cached.abVariant };

    const body = await this.generateCopy(personalityId, event, context, kind);

    try {
      await this.cacheRepo.save({
        personalityId,
        event,
        day,
        contextHash,
        body,
        abVariant: 'A',
      });
    } catch {
      // Duplicate key on concurrent saves is acceptable — ignore.
    }

    return { body, abVariant: 'A' };
  }

  async preGenerateForNextDay(): Promise<void> {
    const tomorrow = format(
      new Date(Date.now() + 24 * 60 * 60 * 1000),
      'yyyy-MM-dd',
    );
    const personalities = this.personalityService.listAll();
    const pregenKinds: NotificationJobKind[] = [
      'morning_setup',
      'evening_check_in',
    ];

    for (const personality of personalities) {
      for (const kind of pregenKinds) {
        const event = KIND_TO_EVENT[kind];
        const contextHash = hashContext({});

        const exists = await this.cacheRepo.findOne({
          where: {
            personalityId: personality.id,
            event,
            day: tomorrow,
            contextHash,
          },
        });
        if (exists) continue;

        const body = await this.generateCopy(personality.id, event, {}, kind);
        try {
          await this.cacheRepo.save({
            personalityId: personality.id,
            event,
            day: tomorrow,
            contextHash,
            body,
            abVariant: 'A',
          });
          this.logger.log(
            `Pre-generated ${personality.id}/${kind} for ${tomorrow}`,
          );
        } catch {
          // Race condition on concurrent pre-gen runs — ignore duplicate.
        }
      }
    }
  }

  private async generateCopy(
    personalityId: string,
    event: string,
    context: Record<string, unknown>,
    kind: NotificationJobKind,
  ): Promise<string> {
    if (!this.openAiProvider?.available) {
      return FALLBACK_BODIES[kind];
    }

    try {
      const systemPrompt = this.personalityService.renderSystemPrompt(
        personalityId,
        event,
        context,
      );

      const contextLine = Object.keys(context).length
        ? ` Context: ${Object.entries(context)
            .map(([k, v]) => `${k}=${v}`)
            .join(', ')}.`
        : '';

      const result = await this.openAiProvider.chat({
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Generate the push notification body.${contextLine}`,
          },
        ],
        model: 'gpt-4o-mini',
        temperature: 0.9,
        maxTokens: 100,
      });

      return result.text.trim();
    } catch (err: any) {
      this.logger.warn(
        `Failed to generate copy for ${personalityId}/${event}: ${err?.message}. Using fallback.`,
      );
      return FALLBACK_BODIES[kind];
    }
  }
}
