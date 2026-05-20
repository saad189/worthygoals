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
export class TaskCompletion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  taskId!: string;

  /** 1–4: 😣 😐 🙂 🔥 */
  @Column({ type: 'tinyint' })
  moodScore!: number;

  @Column({ type: 'text', nullable: true })
  reflection?: string;

  /** FK to a future media table (M06) */
  @Column({ type: 'varchar', length: 36, nullable: true })
  memoryPictureId?: string;

  @Column({ type: 'text', nullable: true })
  mentorReaction?: string;

  @ManyToOne(() => Task, (t) => t.completions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task!: Task;

  @CreateDateColumn()
  createdAt!: Date;
}
