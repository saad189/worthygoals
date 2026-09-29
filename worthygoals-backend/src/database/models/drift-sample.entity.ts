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

@Entity('drift_samples')
export class DriftSample {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'personality_id',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  personalityId: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  event: string | null;

  @Column({ name: 'user_message', type: 'text', nullable: true })
  userMessage: string | null;

  @Column({ type: 'text' })
  output: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  model: string | null;

  /**
   * Whose message this sample quotes. Without it `userMessage` — free text the
   * user typed — could be neither exported nor erased under GDPR. Null for
   * system calls (memory digests, copy pre-generation). FK cascades on user
   * deletion.
   */
  @Index('idx_drift_samples_user_id')
  @Column({ type: 'integer', nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'userId',
    foreignKeyConstraintName: 'fk_drift_samples_user',
  })
  user?: User | null;

  @Index('idx_drift_samples_created_at')
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
