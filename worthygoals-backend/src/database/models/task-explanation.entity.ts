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
export class TaskExplanation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  taskId!: string;

  @Column({ type: 'enum', enum: ExplanationReason })
  reason!: ExplanationReason;

  @Column({ type: 'text', nullable: true })
  freeText?: string;

  @ManyToOne(() => Task, (t) => t.explanations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task!: Task;

  @CreateDateColumn()
  createdAt!: Date;
}
