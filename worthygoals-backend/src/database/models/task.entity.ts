import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { TaskRepeatFrequency, TaskStatus } from 'src/common/constants';
import { Goal } from './goal.entity';
import { TaskCompletion } from './task-completion.entity';
import { TaskExplanation } from './task-explanation.entity';

@Entity('tasks')
@Index('idx_tasks_goal_id', ['goalId'])
@Index('idx_tasks_goal_status', ['goalId', 'status'])
@Index('idx_tasks_due_date', ['dueDate'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  goalId!: string;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.PENDING })
  status!: TaskStatus;

  @Column({ type: 'datetime', nullable: true })
  dueDate?: Date;

  @Column({
    type: 'enum',
    enum: TaskRepeatFrequency,
    default: TaskRepeatFrequency.NONE,
  })
  repeatFrequency!: TaskRepeatFrequency;

  /** Populated for recurring instances: which occurrence # is this */
  @Column({ type: 'int', default: 0 })
  occurrenceIndex!: number;

  /** UUID of the parent recurring task (null for originals) */
  @Column({ type: 'varchar', length: 36, nullable: true })
  parentTaskId?: string;

  @ManyToOne(() => Goal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goalId' })
  goal!: Goal;

  @OneToMany(() => TaskCompletion, (c) => c.task)
  completions!: TaskCompletion[];

  @OneToMany(() => TaskExplanation, (e) => e.task)
  explanations!: TaskExplanation[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
