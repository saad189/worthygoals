import { Message } from 'src/database/models/message.entity';

export class MessageResponseDto {
  id!: string;
  conversationId!: string;
  role!: string;
  contentType!: string;
  text!: string | null;
  clientMessageId!: string | null;
  createdAt!: string;
  userId!: string | null;
  mentorId!: number | null;

  static fromEntity(entity: Message): MessageResponseDto {
    return {
      id: entity.id,
      conversationId: entity.conversationId,
      role: entity.role,
      contentType: entity.contentType,
      text: entity.text,
      clientMessageId: entity.clientMessageId,
      createdAt:
        entity.createdAt instanceof Date
          ? entity.createdAt.toISOString()
          : (entity as any).createdAt,
      userId: entity.userId,
      mentorId: entity.mentorId,
    };
  }
}
