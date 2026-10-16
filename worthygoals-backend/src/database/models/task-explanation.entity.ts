import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ExplanationReason } from 'src/common/constants';
import { Task } from './task.entity';

@Entity('task_explanations')
@Index('idx_explanations_task_id', ['taskId'])
// Expression index on (taskId, UTC day); unsynchronised for the same reason
// as uq_task_completions_task_day.
@Index('uq_task_explanations_task_day', { synchronize: false })
export class TaskExplanation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  taskId!: string;

  @Column({ type: 'varchar', length: 32 })
  reason!: ExplanationReason;

  @Column({ type: 'text', nullable: true })
  freeText?: string;

  @ManyToOne(() => Task, (t) => t.explanations, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'taskId',
    foreignKeyConstraintName: 'fk_explanations_task',
  })
  task!: Task;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
