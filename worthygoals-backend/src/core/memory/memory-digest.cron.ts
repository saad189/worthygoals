import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MemoryService } from './memory.service';
import { AiGatewayService } from 'src/core/ai/gateway/ai-gateway.service';

const DIGEST_LOOKBACK_DAYS = 30;
const SYSTEM_USER_ID = -1;

@Injectable()
export class MemoryDigestCron {
  private readonly logger = new Logger(MemoryDigestCron.name);

  constructor(
    private readonly memory: MemoryService,
    @Optional() private readonly gateway?: AiGatewayService,
  ) {}

  // Weekly Sunday midnight UTC
  @Cron(CronExpression.EVERY_WEEK)
  async generateDigests(): Promise<void> {
    if (!this.gateway) {
      this.logger.warn('AI gateway unavailable — skipping digest generation');
      return;
    }

    const pairs = await this.memory.getActiveUserPersonalityPairs();
    this.logger.log(
      `Generating digests for ${pairs.length} user-personality pairs`,
    );

    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - DIGEST_LOOKBACK_DAYS);

    let generated = 0;
    for (const { userId, personalityId } of pairs) {
      try {
        const texts = await this.memory.getEmbeddingsForDigest(
          userId,
          personalityId,
          periodStart,
        );
        if (texts.length < 3) continue;

        const combined = texts
          .slice(-80)
          .map((t, i) => `[${i + 1}] ${t}`)
          .join('\n');

        const res = await this.gateway.chat({
          userId: SYSTEM_USER_ID,
          feature: 'memory_digest',
          messages: [
            {
              role: 'system',
              content:
                'You are a memory summarizer. Summarize the following user interactions ' +
                'from the last 30 days into 3–5 sentences. Focus on recurring themes, ' +
                'emotional patterns, goals mentioned, and any notable progress or setbacks. ' +
                'Write in third person as if briefing a mentor who is about to speak with this user.',
            },
            { role: 'user', content: combined },
          ],
          maxTokens: 300,
        });

        await this.memory.saveDigest(
          userId,
          personalityId,
          res.text,
          periodStart,
          periodEnd,
        );
        generated++;
      } catch (err: any) {
        this.logger.warn(
          `Digest failed for user ${userId} / ${personalityId}: ${err?.message}`,
        );
      }
    }

    this.logger.log(
      `Digest run complete — ${generated}/${pairs.length} generated`,
    );
  }
}
