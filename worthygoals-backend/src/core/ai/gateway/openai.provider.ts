import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatProviderParams, ChatProviderResult, IChatProvider } from './types';

/**
 * Hard ceiling on a single model call.
 *
 * There was none. A request the client had already abandoned kept generating
 * server-side and kept billing — and the client's own 10s default timeout made
 * abandonment the normal case. The SDK cancels the underlying request when
 * this fires, so the tokens stop.
 */
const AI_REQUEST_TIMEOUT_MS = 45_000;

@Injectable()
export class OpenAiProvider implements IChatProvider {
  readonly name = 'openai';
  readonly available: boolean;
  readonly defaultModel: string;

  private readonly client: OpenAI | null = null;
  private readonly logger = new Logger(OpenAiProvider.name);

  constructor(private readonly config: ConfigService) {
    const apiKey = config.get<string>('OPENAI_API_KEY');
    this.defaultModel = config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';

    if (apiKey) {
      this.client = new OpenAI({ apiKey });
      this.available = true;
    } else {
      this.logger.warn('OPENAI_API_KEY not set — OpenAI provider disabled');
      this.available = false;
    }
  }

  async chat(params: ChatProviderParams): Promise<ChatProviderResult> {
    if (!this.client) throw new Error('OpenAI provider is not configured');

    const completion = await this.client.chat.completions.create(
      {
        model: params.model ?? this.defaultModel,
        messages: params.messages,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      },
      { timeout: AI_REQUEST_TIMEOUT_MS },
    );

    // The SDK types both fields; the `as any` casts only hid a future change.
    const usage = completion.usage;

    return {
      text: completion.choices?.[0]?.message?.content ?? '',
      model: completion.model ?? params.model ?? this.defaultModel,
      tokensIn:
        typeof usage?.prompt_tokens === 'number' ? usage.prompt_tokens : null,
      tokensOut:
        typeof usage?.completion_tokens === 'number'
          ? usage.completion_tokens
          : null,
    };
  }

  async chatStream(
    params: ChatProviderParams,
    onChunk: (chunk: string) => void,
  ): Promise<ChatProviderResult> {
    if (!this.client) throw new Error('OpenAI provider is not configured');

    const stream = await this.client.chat.completions.create(
      {
        model: params.model ?? this.defaultModel,
        messages: params.messages,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        stream: true,
        stream_options: { include_usage: true },
      },
      { timeout: AI_REQUEST_TIMEOUT_MS },
    );

    let text = '';
    let tokensIn: number | null = null;
    let tokensOut: number | null = null;
    let model = params.model ?? this.defaultModel;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        text += delta;
        onChunk(delta);
      }
      if (chunk.usage) {
        tokensIn = chunk.usage.prompt_tokens ?? null;
        tokensOut = chunk.usage.completion_tokens ?? null;
      }
      if (chunk.model) model = chunk.model;
    }

    return { text, model, tokensIn, tokensOut };
  }
}
