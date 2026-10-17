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

const DEFAULT_COST_PER_MILLION: Record<string, { in: number; out: number }> = {
  'gpt-4o-mini': { in: 0.15, out: 0.6 },
  'gpt-4o': { in: 5.0, out: 15.0 },
  'claude-3-5-haiku-20241022': { in: 0.8, out: 4.0 },
  'claude-3-5-sonnet-20241022': { in: 3.0, out: 15.0 },
  'claude-3-haiku-20240307': { in: 0.25, out: 1.25 },
  'claude-sonnet-4-6': { in: 3.0, out: 15.0 },
};

@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);
  private readonly breaker = new CircuitBreaker();
  private readonly costPerMillion: Record<string, { in: number; out: number }>;

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
  ) {
    const raw = this.config.get<string>('AI_MODEL_COSTS_JSON');
    if (raw) {
      try {
        this.costPerMillion = {
          ...DEFAULT_COST_PER_MILLION,
          ...JSON.parse(raw),
        };
      } catch {
        this.logger.warn(
          'AI_MODEL_COSTS_JSON is not valid JSON — using defaults',
        );
        this.costPerMillion = DEFAULT_COST_PER_MILLION;
      }
    } else {
      this.costPerMillion = DEFAULT_COST_PER_MILLION;
    }

    // M-3: these are @Optional() for test convenience but must always be
    // wired in production — surface a missing module import at boot.
    if (!this.personalityService) {
      this.logger.warn(
        'PersonalityService not injected — persona prompts will be skipped on every chat call',
      );
    }
    if (!this.memoryService) {
      this.logger.warn(
        'MemoryService not injected — [Memory Context] will be skipped on every chat call',
      );
    }
  }

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

    // The persona's routing is the default for every caller (chat, reactions,
    // notifications); an explicit request value still wins.
    const routing = req.personalityId
      ? this.personalityService?.getRoutingConfig(req.personalityId)
      : undefined;
    const params = {
      messages,
      temperature: req.temperature ?? routing?.temperature,
      maxTokens: req.maxTokens ?? routing?.max_tokens,
    };

    // Chunks already on the client can't be taken back, so a stream that dies
    // part-way must not fail over: the fallback would stream the whole reply
    // again after the half one.
    let emitted = false;
    const trackedChunk = onChunk
      ? (chunk: string) => {
          emitted = true;
          onChunk(chunk);
        }
      : undefined;
    // The tier resolves per provider, so the fallback gets its own model for
    // it (Anthropic rejects 'gpt-4o').
    const run = (provider: IChatProvider) => {
      const p = {
        ...params,
        model: req.quality === 'high' ? provider.highQualityModel : undefined,
      };
      return trackedChunk && provider.chatStream
        ? provider.chatStream(p, trackedChunk)
        : provider.chat(p);
    };

    const t0 = Date.now();
    let result: Awaited<ReturnType<IChatProvider['chat']>> | null = null;
    let usedProvider: IChatProvider = primary;

    if (primary.available && this.breaker.isAvailable(primary.name)) {
      try {
        result = await run(primary);
        this.breaker.recordSuccess(primary.name);
      } catch (err: any) {
        if (isProviderFault(err)) this.breaker.recordFailure(primary.name);
        if (emitted) {
          this.logger.error(
            `${primary.name} failed mid-stream (${err?.message}); not failing over`,
          );
          throw new HttpException('AI service temporarily unavailable', 503);
        }
        this.logger.warn(
          `${primary.name} failed (${err?.message}), failing over to ${fallback.name}`,
        );
      }
    }

    if (
      !result &&
      fallback.available &&
      this.breaker.isAvailable(fallback.name)
    ) {
      try {
        result = await run(fallback);
        this.breaker.recordSuccess(fallback.name);
        usedProvider = fallback;
      } catch (err: any) {
        if (isProviderFault(err)) this.breaker.recordFailure(fallback.name);
        this.logger.error(`Both providers failed: ${err?.message}`);
        throw new HttpException('AI service temporarily unavailable', 503);
      }
    }

    if (!result) {
      throw new HttpException('No AI provider is available', 503);
    }

    const latencyMs = Date.now() - t0;
    const costRates = this.resolveCostRates(result.model);
    const costUsd =
      costRates && result.tokensIn !== null && result.tokensOut !== null
        ? (result.tokensIn * costRates.in + result.tokensOut * costRates.out) /
          1_000_000
        : null;

    const call = this.aiCallRepo.create({
      // System callers pass a negative sentinel; ai_calls.userId now has a
      // cascading FK to users, so they are recorded with no user.
      userId: req.userId > 0 ? req.userId : null,
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

    this.maybeSampleDrift(req, result.text, result.model);

    return {
      text: result.text,
      model: result.model,
      provider: usedProvider.name,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
    };
  }

  /**
   * Providers return the API's versioned model id (e.g. gpt-4o-2024-08-06),
   * so an exact lookup against the bare keys in the cost map would miss and
   * silently log costUsd = null. Fall back to the longest matching prefix.
   */
  private resolveCostRates(
    model: string,
  ): { in: number; out: number } | undefined {
    if (this.costPerMillion[model]) return this.costPerMillion[model];
    const prefix = Object.keys(this.costPerMillion)
      .filter((key) => model.startsWith(key))
      .sort((a, b) => b.length - a.length)[0];
    if (!prefix) {
      this.logger.warn(`No cost rates configured for model "${model}"`);
      return undefined;
    }
    return this.costPerMillion[prefix];
  }

  private resolveActiveProvider(): IChatProvider {
    const flag =
      this.config.get<string>('AI_ACTIVE_PROVIDER')?.toLowerCase() ?? 'openai';
    if (flag === 'anthropic' && this.anthropic.available) return this.anthropic;
    return this.openai;
  }

  private maybeSampleDrift(
    req: GatewayChatRequest,
    output: string,
    model: string,
  ): void {
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
          model,
          // System callers pass a negative sentinel id; only real users link.
          userId: req.userId > 0 ? req.userId : null,
        }),
      )
      .catch((err) => {
        this.logger.error(`Failed to save drift sample: ${err.message}`);
      });
  }

  private async injectPersonality(
    req: GatewayChatRequest,
  ): Promise<ChatMessage[]> {
    if (!req.personalityId) {
      return req.messages;
    }
    if (!this.personalityService) {
      // M-3: a personality was requested but the service isn't wired —
      // never degrade silently on the chat path.
      this.logger.error(
        `personalityId "${req.personalityId}" requested but PersonalityService is not injected — responding without persona`,
      );
      return req.messages;
    }

    try {
      const personaPrompt = this.personalityService.renderSystemPrompt(
        req.personalityId,
        req.event ?? 'default',
        req.context ?? {},
      );

      let memCtx: string | null = null;
      if (this.memoryService && req.userId > 0) {
        const lastUserMsg =
          [...req.messages].reverse().find((m) => m.role === 'user')?.content ??
          '';
        memCtx = await this.memoryService.buildContext(
          req.userId,
          req.personalityId,
          lastUserMsg,
        );
      }

      // Persona first: it is the instruction. Memory (derived from the user's
      // own words) and the caller's system messages (e.g. the conversation
      // summary) follow as context. Callers' system messages used to be
      // dropped here, so chat never saw its summary.
      const system = [
        personaPrompt,
        memCtx,
        ...req.messages
          .filter((m) => m.role === 'system')
          .map((m) => m.content),
      ].filter((s): s is string => !!s);
      return [
        ...system.map((content) => ({ role: 'system' as const, content })),
        ...req.messages.filter((m) => m.role !== 'system'),
      ];
    } catch (err: any) {
      this.logger.warn(
        `Personality injection failed for "${req.personalityId}": ${err?.message}. Proceeding without.`,
      );
      return req.messages;
    }
  }
}

/**
 * Whether a provider error says the provider is unhealthy (5xx, 429, timeout,
 * network) rather than that this request was bad. Only the former may open the
 * shared circuit breaker — a 400 such as context_length_exceeded is one user's
 * request, and counting it let a single user trip the breaker for everyone.
 */
export function isProviderFault(err: any): boolean {
  const status: number | undefined = err?.status ?? err?.response?.status;
  return (
    status === undefined || status >= 500 || status === 408 || status === 429
  );
}
