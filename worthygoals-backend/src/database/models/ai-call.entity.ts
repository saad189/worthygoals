import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('ai_calls')
@Index('idx_ai_calls_user_date', ['userId', 'createdAt'])
export class AiCall {
  @PrimaryGeneratedColumn()
  id: number;

  // Nullable: system calls (memory digests, copy pre-generation) have no user.
  // They used a -1 sentinel, which the cascading FK to users cannot accept.
  @Column({ type: 'integer', nullable: true })
  userId: number | null;

  @Column({ length: 64 })
  feature: string;

  @Column({ length: 32 })
  provider: string;

  @Column({ length: 64 })
  model: string;

  @Column({ type: 'int', nullable: true })
  inputTokens: number | null;

  @Column({ type: 'int', nullable: true })
  outputTokens: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 8, nullable: true })
  costUsd: number | null;

  @Column({ type: 'int', nullable: true })
  latencyMs: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', foreignKeyConstraintName: 'fk_ai_calls_user' })
  user?: User;
}
