import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('ai_calls')
@Index(['userId', 'createdAt'])
export class AiCall {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

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

  @CreateDateColumn()
  createdAt: Date;
}
