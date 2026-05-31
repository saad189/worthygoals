import { HttpException, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiCall } from 'src/database/models/ai-call.entity';
import { DriftSample } from 'src/database/models/drift-sample.entity';
import { User } from 'src/database/models/user.entity';
import { UserTier } from 'src/common/constants/enums';
import { QuotaExceededException, QuotaService } from '../quota/quota.service';
import { OpenAiProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';
import { CircuitBreaker } from './circuit-breaker';
import {
  ChatMessage,
  GatewayChatRequest,
  GatewayChatResponse,
  IChatProvider,
} from './types';
import { PersonalityService } from 'src/core/personalities/personality.service';
import { MemoryService } from 'src/core/memory/memory.service';

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
    @InjectRepository(DriftSample)
    private readonly driftRepo: Repository<DriftSample>,
    @Optional() private readonly personalityService?: PersonalityService,
    @Optional() private readonly memoryService?: MemoryService,
  ) {}

  async chat(req: GatewayChatRequest): Promise<GatewayChatResponse> {
    return this.chatInternal(req);
  }

  async chatStream(
    req: GatewayChatRequest,
    onChunk: (chunk: string) => void,
  ): Promise<GatewayChatResponse> {
    return this.chatInternal(req, onChunk);
  }

  private async chatInternal(
    req: GatewayChatRequest,
    onChunk?: (chunk: string) => void,
  ): Promise<GatewayChatResponse> {
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

    const messages = await this.injectPersonality(req);
    const primary = this.resolveActiveProvider();
    const fallback = primary === this.openai ? this.anthropic : this.openai;

    const params = {
      messages,
      model: req.model,
      temperature: req.temperature,
      maxTokens: req.maxTokens,
    };

    const t0 = Date.now();
    let result: Awaited<ReturnType<IChatProvider['chat']>> | null = null;
    let usedProvider: IChatProvider = primary;

    if (primary.available && this.breaker.isAvailable(primary.name)) {
      try {
        result = onChunk && primary.chatStream
          ? await primary.chatStream(params, onChunk)
          : await primary.chat(params);
        this.breaker.recordSuccess(primary.name);
      } catch (err: any) {
        this.logger.warn(
          `${primary.name} failed (${err?.message}), failing over to ${fallback.name}`,
        );
        this.breaker.recordFailure(primary.name);
      }
    }

    if (
      !result &&
      fallback.available &&
      this.breaker.isAvailable(fallback.name)
    ) {
      try {
        result = onChunk && fallback.chatStream
          ? await fallback.chatStream(params, onChunk)
          : await fallback.chat(params);
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
    const costUsd = computeCostUsd(
      result.model,
      result.tokensIn,
      result.tokensOut,
    );

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

    this.maybeSampleDrift(req, result.text);

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

  private maybeSampleDrift(req: GatewayChatRequest, output: string): void {
    if (Math.random() >= 0.001) return;
    const userMessage =
      [...req.messages].reverse().find((m) => m.role === 'user')?.content ??
      null;

    this.driftRepo
      .save(
        this.driftRepo.create({
          personalityId: req.personalityId ?? null,
          event: req.event ?? null,
          userMessage,
          output,
          model: req.model ?? null,
        }),
      )
      .catch((err) => {
        this.logger.error(`Failed to save drift sample: ${err.message}`);
      });
  }

  private async injectPersonality(
    req: GatewayChatRequest,
  ): Promise<ChatMessage[]> {
    if (!req.personalityId || !this.personalityService) {
      return req.messages;
    }

    try {
      let systemPrompt = this.personalityService.renderSystemPrompt(
        req.personalityId,
        req.event ?? 'default',
        req.context ?? {},
      );

      if (this.memoryService && req.userId > 0) {
        const lastUserMsg =
          [...req.messages].reverse().find((m) => m.role === 'user')?.content ??
          '';
        const memCtx = await this.memoryService.buildContext(
          req.userId,
          req.personalityId,
          lastUserMsg,
        );
        if (memCtx) {
          systemPrompt = `${memCtx}\n\n${systemPrompt}`;
        }
      }

      const withoutSystem = req.messages.filter((m) => m.role !== 'system');
      return [{ role: 'system', content: systemPrompt }, ...withoutSystem];
    } catch (err: any) {
      this.logger.warn(
        `Personality injection failed for "${req.personalityId}": ${err?.message}. Proceeding without.`,
      );
      return req.messages;
    }
  }
}
