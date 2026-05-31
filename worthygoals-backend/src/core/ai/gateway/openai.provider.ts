import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatProviderParams, ChatProviderResult, IChatProvider } from './types';

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

    const completion = await this.client.chat.completions.create({
      model: params.model ?? this.defaultModel,
      messages: params.messages,
      temperature: params.temperature,
      max_tokens: params.maxTokens,
    });

    const usage: any = (completion as any).usage;

    return {
      text: completion.choices?.[0]?.message?.content ?? '',
      model: (completion as any).model ?? params.model ?? this.defaultModel,
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

    const stream = await this.client.chat.completions.create({
      model: params.model ?? this.defaultModel,
      messages: params.messages,
      temperature: params.temperature,
      max_tokens: params.maxTokens,
      stream: true,
      stream_options: { include_usage: true },
    });

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
      if ((chunk as any).model) model = (chunk as any).model;
    }

    return { text, model, tokensIn, tokensOut };
  }
}
