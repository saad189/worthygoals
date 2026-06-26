import { MessageRole, MessageContentType } from 'src/common/constants';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { User } from './user.entity';
import { Mentor } from './mentor.entity';
import { MessageAttachment } from './message-attachment.entity';
import { MessageFeedback } from './message-feedback.entity';

@Entity({ name: 'messages' })
@Index('idx_messages_conversation_created_at', ['conversationId', 'createdAt'])
@Index('idx_messages_conversation_archived_at', [
  'conversationId',
  'archivedAt',
])
@Index('idx_messages_conversation_id_id', ['conversationId', 'id'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index('idx_messages_conversation_id')
  conversationId!: string;

  @ManyToOne(() => Conversation, (c) => c.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation!: Conversation;

  @Column({ type: 'varchar', length: 16 })
  role!: MessageRole;

  /**
   * Author links (optional depending on role)
   * - role=user   => userId not null
   * - role=mentor => mentorId not null
   * - system/tool => both null
   */
  @Column({ type: 'int', nullable: true })
  @Index('idx_messages_user_id')
  userId!: number | null;

  @ManyToOne(() => User, (u) => u.messages, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user!: User | null;

  @Column({ type: 'int', nullable: true })
  @Index('idx_messages_mentor_id')
  mentorId!: number | null;

  @ManyToOne(() => Mentor, (m) => m.messages, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'mentorId' })
  mentor!: Mentor | null;

  @Column({ type: 'varchar', length: 16, default: MessageContentType.TEXT })
  contentType!: MessageContentType;

  @Column({ type: 'text', nullable: true })
  text!: string | null;

  @Column({ type: 'json', nullable: true })
  content!: Record<string, any> | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  clientMessageId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  replyToMessageId!: string | null;

  @Column({ type: 'int', nullable: true })
  tokensIn!: number | null;

  @Column({ type: 'int', nullable: true })
  tokensOut!: number | null;

  @Column({ type: 'json', nullable: true })
  safetyFlags!: Record<string, any> | null;

  @Column({ type: 'timestamptz', nullable: true })
  archivedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => MessageAttachment, (a) => a.message)
  attachments!: MessageAttachment[];

  @OneToMany(() => MessageFeedback, (f) => f.message)
  feedback!: MessageFeedback[];
}
