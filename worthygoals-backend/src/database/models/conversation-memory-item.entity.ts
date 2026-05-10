import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity({ name: 'conversation_memory_items' })
@Index('idx_memory_items_conversation_key', ['conversationId', 'key'])
export class ConversationMemoryItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  conversationId!: string;

  @ManyToOne(() => Conversation, (c) => c.memoryItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation!: Conversation;

  @Column({ type: 'varchar', length: 64 })
  key!: string;

  @Column({ type: 'json' })
  value!: Record<string, any>;

  @Column({ type: 'float', nullable: true })
  confidence!: number | null;

  @Column({ type: 'uuid', nullable: true })
  sourceMessageId!: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
