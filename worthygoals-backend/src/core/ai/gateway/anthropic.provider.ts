import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  ChatMessage,
  ChatProviderParams,
  ChatProviderResult,
  IChatProvider,
} from './types';

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

  async chat(params: ChatProviderParams): Promise<ChatProviderResult> {
    if (!this.client) throw new Error('Anthropic provider is not configured');

    const { system, chatMessages } = this.splitMessages(params.messages);

    const response = await this.client.messages.create({
      model: params.model ?? this.defaultModel,
      max_tokens: params.maxTokens ?? 1024,
      temperature: params.temperature,
      system: system || undefined,
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

  async chatStream(
    params: ChatProviderParams,
    onChunk: (chunk: string) => void,
  ): Promise<ChatProviderResult> {
    if (!this.client) throw new Error('Anthropic provider is not configured');

    const { system, chatMessages } = this.splitMessages(params.messages);

    let text = '';
    let tokensIn: number | null = null;
    let tokensOut: number | null = null;
    let model = params.model ?? this.defaultModel;

    const stream = this.client.messages.stream({
      model: params.model ?? this.defaultModel,
      max_tokens: params.maxTokens ?? 1024,
      temperature: params.temperature,
      system: system || undefined,
      messages: chatMessages,
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        text += event.delta.text;
        onChunk(event.delta.text);
      }
      if (event.type === 'message_delta' && event.usage) {
        tokensOut = event.usage.output_tokens ?? null;
      }
      if (event.type === 'message_start' && event.message) {
        tokensIn = event.message.usage?.input_tokens ?? null;
        model = event.message.model ?? model;
      }
    }

    return { text, model, tokensIn, tokensOut };
  }

  private splitMessages(messages: ChatMessage[]): {
    system: string;
    chatMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  } {
    const system = messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n');

    const chatMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    return { system, chatMessages };
  }
}
