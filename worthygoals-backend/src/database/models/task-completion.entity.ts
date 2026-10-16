import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Task } from './task.entity';

@Entity('task_completions')
@Index('idx_completions_task_id', ['taskId'])
// Expression index on (taskId, UTC day) — see AddPerDayCompletionUniqueness.
// TypeORM cannot express it, so it is declared unsynchronised.
@Index('uq_task_completions_task_day', { synchronize: false })
export class TaskCompletion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  taskId!: string;

  /** 1–4: 😣 😐 🙂 🔥 */
  @Column({ type: 'smallint' })
  moodScore!: number;

  @Column({ type: 'text', nullable: true })
  reflection?: string;

  /** FK to a future media table (M06) */
  @Column({ type: 'varchar', length: 36, nullable: true })
  memoryPictureId?: string;

  @Column({ type: 'text', nullable: true })
  mentorReaction?: string;

  @ManyToOne(() => Task, (t) => t.completions, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'taskId',
    foreignKeyConstraintName: 'fk_completions_task',
  })
  task!: Task;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
