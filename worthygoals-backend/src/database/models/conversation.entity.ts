import { ConversationStatus } from 'src/common/constants';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Mentor } from './mentor.entity';
import { Message } from './message.entity';
import { ConversationSummary } from './conversation-summary.entity';
import { ConversationMemoryItem } from './conversation-memory-item.entity';

@Entity({ name: 'conversations' })
@Index('idx_conversations_user_last_message_at', ['userId', 'lastMessageAt'])
@Index('idx_conversations_mentor_last_message_at', [
  'mentorId',
  'lastMessageAt',
])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  @Index('idx_conversations_user_id')
  userId!: number;

  @ManyToOne(() => User, (u) => u.conversations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user!: User;

  @Column({ type: 'int' })
  @Index('idx_conversations_mentor_id')
  mentorId!: number;

  @ManyToOne(() => Mentor, (m) => m.conversations, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'mentorId' })
  mentor!: Mentor;

  @Column({ type: 'varchar', length: 16, default: ConversationStatus.ACTIVE })
  status!: ConversationStatus;

  @Column({ type: 'varchar', length: 180, nullable: true })
  title!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastMessageAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  lastMessageId!: string | null;

  @Column({ type: 'json', nullable: true })
  metadata!: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  // Relations
  @OneToMany(() => Message, (m) => m.conversation)
  messages!: Message[];

  @OneToMany(() => ConversationSummary, (s) => s.conversation)
  summaries!: ConversationSummary[];

  @OneToMany(() => ConversationMemoryItem, (mi) => mi.conversation)
  memoryItems!: ConversationMemoryItem[];
}
