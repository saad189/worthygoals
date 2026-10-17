export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GatewayChatRequest {
  userId: number;
  feature: string;
  messages: ChatMessage[];
  /**
   * Provider-neutral model tier. 'high' runs on each provider's stronger
   * model; omit for its default. Callers never name a model id: the gateway
   * may fail over to the other provider, which would reject it.
   */
  quality?: 'high';
  temperature?: number;
  maxTokens?: number;
  personalityId?: string;
  event?: string;
  context?: Record<string, unknown>;
}

export interface GatewayChatResponse {
  text: string;
  model: string;
  provider: string;
  tokensIn: number | null;
  tokensOut: number | null;
}

export interface ChatProviderResult {
  text: string;
  model: string;
  tokensIn: number | null;
  tokensOut: number | null;
}

export interface ChatProviderParams {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface IChatProvider {
  readonly name: string;
  readonly defaultModel: string;
  readonly highQualityModel: string;
  readonly available: boolean;
  chat(params: ChatProviderParams): Promise<ChatProviderResult>;
  chatStream?(
    params: ChatProviderParams,
    onChunk: (chunk: string) => void,
  ): Promise<ChatProviderResult>;
}
