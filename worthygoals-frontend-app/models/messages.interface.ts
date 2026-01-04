export type ApiMessageRole = 'user' | 'mentor' | 'system' | 'tool' | string;

export interface ApiMessage {
  id: string;
  conversationId: string;
  role: ApiMessageRole;
  contentType?: string;
  text: string | null;
  clientMessageId: string | null;
  createdAt: string;

  userId?: string | null;
  mentorId?: number | null;
}
