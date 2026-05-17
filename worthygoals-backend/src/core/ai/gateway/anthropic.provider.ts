import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { ChatMessage, IChatProvider } from './types';

@Injectable()
export class AnthropicProvider implements IChatProvider {
  readonly name = 'anthropic';
  readonly available: boolean;
  readonly defaultModel = 'claude-3-5-haiku-20241022';

  private readonly client: Anthropic | null = null;
  private readonly logger = new Logger(AnthropicProvider.name);

  constructor(private readonly config: ConfigService) {
    const apiKey = config.get<string>('ANTHROPIC_API_KEY');

    if (apiKey) {
      this.client = new Anthropic({ apiKey });
      this.available = true;
    } else {
      this.logger.warn(
        'ANTHROPIC_API_KEY not set — Anthropic provider disabled',
      );
      this.available = false;
    }
  }

  async chat(params: {
    messages: ChatMessage[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }) {
    if (!this.client) throw new Error('Anthropic provider is not configured');

    const systemParts = params.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n');

    const chatMessages = params.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const response = await this.client.messages.create({
      model: params.model ?? this.defaultModel,
      max_tokens: params.maxTokens ?? 1024,
      temperature: params.temperature,
      system: systemParts || undefined,
      messages: chatMessages,
    });

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as Anthropic.TextBlock).text)
      .join('');

    return {
      text,
      model: response.model ?? params.model ?? this.defaultModel,
      tokensIn: response.usage?.input_tokens ?? null,
      tokensOut: response.usage?.output_tokens ?? null,
    };
  }
}
