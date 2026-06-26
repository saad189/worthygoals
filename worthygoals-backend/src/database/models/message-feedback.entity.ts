import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Message } from './message.entity';
import { User } from './user.entity';

@Entity({ name: 'message_feedback' })
@Index('idx_message_feedback_message_id', ['messageId'])
@Index('idx_message_feedback_user_id', ['userId'])
export class MessageFeedback {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  messageId!: string;

  @ManyToOne(() => Message, (m) => m.feedback, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'messageId' })
  message!: Message;

  /**
   * who gave the feedback (usually the chatting user)
   */
  @Column({ type: 'int' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user!: User;

  @Column({ type: 'smallint' })
  rating!: number; // e.g. -1, +1 or 1..5 later

  @Column({ type: 'json', nullable: true })
  tags!: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
