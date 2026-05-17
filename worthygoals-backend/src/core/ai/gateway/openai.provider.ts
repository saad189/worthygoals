import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatMessage, IChatProvider } from './types';

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

  async chat(params: {
    messages: ChatMessage[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }) {
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
}
