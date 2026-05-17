export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GatewayChatRequest {
  userId: number;
  feature: string;
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GatewayChatResponse {
  text: string;
  model: string;
  provider: string;
  tokensIn: number | null;
  tokensOut: number | null;
}

export interface IChatProvider {
  readonly name: string;
  readonly defaultModel: string;
  readonly available: boolean;
  chat(params: {
    messages: ChatMessage[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{
    text: string;
    model: string;
    tokensIn: number | null;
    tokensOut: number | null;
  }>;
}
