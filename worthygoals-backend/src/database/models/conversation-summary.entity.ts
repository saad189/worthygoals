import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { SummaryType } from 'src/common/constants';

@Entity({ name: 'conversation_summaries' })
@Index('idx_conversation_summaries_conversation_created_at', [
  'conversationId',
  'createdAt',
])
@Index('idx_conversation_summaries_range', [
  'conversationId',
  'fromMessageId',
  'toMessageId',
])
export class ConversationSummary {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  conversationId!: string;

  @ManyToOne(() => Conversation, (c) => c.summaries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation!: Conversation;

  @Column({ type: 'varchar', length: 16 })
  summaryType!: SummaryType;

  @Column({ type: 'uuid' })
  fromMessageId!: string;

  @Column({ type: 'uuid' })
  toMessageId!: string;

  @Column({ type: 'text' })
  summaryText!: string;

  @Column({ type: 'json', nullable: true })
  summaryEmotions!: Record<string, any> | null;

  @Column({ type: 'json', nullable: true })
  summaryTopics!: Record<string, any> | null;

  @Column({ type: 'json', nullable: true })
  keyFacts!: Record<string, any> | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  model!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  promptVersion!: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
