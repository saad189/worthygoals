import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiCall } from 'src/database/models/ai-call.entity';
import { User } from 'src/database/models/user.entity';
import { UserTier } from 'src/common/constants/enums';
import { QuotaExceededException, QuotaService } from '../quota/quota.service';
import { OpenAiProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';
import { CircuitBreaker } from './circuit-breaker';
import {
  GatewayChatRequest,
  GatewayChatResponse,
  IChatProvider,
} from './types';

const COST_PER_MILLION: Record<string, { in: number; out: number }> = {
  'gpt-4o-mini': { in: 0.15, out: 0.6 },
  'gpt-4o': { in: 5.0, out: 15.0 },
  'claude-3-5-haiku-20241022': { in: 0.8, out: 4.0 },
  'claude-3-5-sonnet-20241022': { in: 3.0, out: 15.0 },
  'claude-3-haiku-20240307': { in: 0.25, out: 1.25 },
};

function computeCostUsd(
  model: string,
  tokensIn: number | null,
  tokensOut: number | null,
): number | null {
  const rates = COST_PER_MILLION[model];
  if (!rates || tokensIn === null || tokensOut === null) return null;
  return (tokensIn * rates.in + tokensOut * rates.out) / 1_000_000;
}

@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);
  private readonly breaker = new CircuitBreaker();

  constructor(
    private readonly config: ConfigService,
    private readonly openai: OpenAiProvider,
    private readonly anthropic: AnthropicProvider,
    private readonly quota: QuotaService,
    @InjectRepository(AiCall)
    private readonly aiCallRepo: Repository<AiCall>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async chat(req: GatewayChatRequest): Promise<GatewayChatResponse> {
    const user = await this.userRepo.findOne({
      where: { id: req.userId },
      select: { id: true, tier: true },
    });
    const tier: UserTier = (user?.tier as UserTier) ?? UserTier.FREE;

    try {
      await this.quota.checkAndEnforce(req.userId, tier);
    } catch (e) {
      if (e instanceof QuotaExceededException) {
        throw new HttpException({ code: e.code, message: e.message }, 402);
      }
      throw e;
    }

    const primary = this.resolveActiveProvider();
    const fallback = primary === this.openai ? this.anthropic : this.openai;

    const t0 = Date.now();
    let result: Awaited<ReturnType<IChatProvider['chat']>> | null = null;
    let usedProvider: IChatProvider = primary;

    if (primary.available && this.breaker.isAvailable(primary.name)) {
      try {
        result = await primary.chat({
          messages: req.messages,
          model: req.model,
          temperature: req.temperature,
          maxTokens: req.maxTokens,
        });
        this.breaker.recordSuccess(primary.name);
      } catch (err: any) {
        this.logger.warn(
          `${primary.name} failed (${err?.message}), failing over to ${fallback.name}`,
        );
        this.breaker.recordFailure(primary.name);
      }
    }

    if (!result && fallback.available && this.breaker.isAvailable(fallback.name)) {
      try {
        result = await fallback.chat({
          messages: req.messages,
          temperature: req.temperature,
          maxTokens: req.maxTokens,
        });
        this.breaker.recordSuccess(fallback.name);
        usedProvider = fallback;
      } catch (err: any) {
        this.breaker.recordFailure(fallback.name);
        this.logger.error(`Both providers failed: ${err?.message}`);
        throw new HttpException('AI service temporarily unavailable', 503);
      }
    }

    if (!result) {
      throw new HttpException('No AI provider is available', 503);
    }

    const latencyMs = Date.now() - t0;
    const costUsd = computeCostUsd(result.model, result.tokensIn, result.tokensOut);

    const call = this.aiCallRepo.create({
      userId: req.userId,
      feature: req.feature,
      provider: usedProvider.name,
      model: result.model,
      inputTokens: result.tokensIn,
      outputTokens: result.tokensOut,
      costUsd,
      latencyMs,
    });
    await this.aiCallRepo.save(call).catch((err) => {
      this.logger.error(`Failed to log ai_call: ${err.message}`);
    });

    return {
      text: result.text,
      model: result.model,
      provider: usedProvider.name,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
    };
  }

  private resolveActiveProvider(): IChatProvider {
    const flag =
      this.config.get<string>('AI_ACTIVE_PROVIDER')?.toLowerCase() ?? 'openai';
    if (flag === 'anthropic' && this.anthropic.available) return this.anthropic;
    return this.openai;
  }
}
