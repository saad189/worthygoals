import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private readonly client: OpenAI;
  private readonly defaultModel: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('OPENAI_API_KEY') ??
      process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    this.defaultModel =
      this.configService.get<string>('OPENAI_MODEL') ??
      process.env.OPENAI_MODEL ??
      'gpt-4o-mini';

    this.client = new OpenAI({ apiKey });
  }

  getClient(): OpenAI {
    return this.client;
  }

  async chatText(params: {
    messages: OpenAI.ChatCompletionMessageParam[];
    model?: string;
    temperature?: number;
  }): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: params.model ?? this.defaultModel,
      messages: params.messages,
      temperature: params.temperature,
    });

    return completion.choices?.[0]?.message?.content ?? '';
  }

  async chatTextWithUsage(params: {
    messages: OpenAI.ChatCompletionMessageParam[];
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
  }): Promise<{
    text: string;
    model: string;
    tokensIn: number | null;
    tokensOut: number | null;
    rawUsage: any;
  }> {
    const completion = await this.client.chat.completions.create({
      model: params.model ?? this.defaultModel,
      messages: params.messages,
      temperature: params.temperature,
      max_tokens: params.maxOutputTokens,
    });

    const text = completion.choices?.[0]?.message?.content ?? '';
    const usage: any = (completion as any).usage;

    return {
      text,
      model: (completion as any).model ?? params.model ?? this.defaultModel,
      tokensIn:
        typeof usage?.prompt_tokens === 'number' ? usage.prompt_tokens : null,
      tokensOut:
        typeof usage?.completion_tokens === 'number'
          ? usage.completion_tokens
          : null,
      rawUsage: usage ?? null,
    };
  }
}
