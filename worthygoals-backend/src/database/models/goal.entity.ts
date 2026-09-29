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
import { GoalCategory, GoalStatus } from 'src/common/constants';
import { User } from './user.entity';
import { Mentor } from './mentor.entity';
import { Task } from './task.entity';

@Entity('goals')
@Index('idx_goals_user_id', ['userId'])
@Index('idx_goals_user_status', ['userId', 'status'])
@Index('idx_goals_user_created_at', ['userId', 'createdAt'])
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  userId!: number;

  @Column({ type: 'int', nullable: true })
  mentorId?: number;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 32, default: GoalCategory.POWER })
  category!: GoalCategory;

  @Column({ type: 'varchar', length: 16, default: GoalStatus.ACTIVE })
  status!: GoalStatus;

  @Column({ type: 'text', nullable: true })
  costText?: string;

  @Column({ type: 'text', nullable: true })
  benefitText?: string;

  @Column({ type: 'text', nullable: true })
  failureText?: string;

  @Column({ type: 'timestamptz', nullable: true })
  deadline?: Date;

  @Column({ type: 'jsonb', nullable: true })
  repeatRule?: Record<string, unknown>;

  // pg returns NUMERIC as a string (to keep precision); convert on read so
  // the declared `number` is true at runtime instead of at one call site.
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (v?: number | null) => v,
      from: (v: string | null) => (v == null ? v : Number(v)),
    },
  })
  stakeAmount?: number;

  @Column({ length: 512, nullable: true })
  imageUri?: string;

  @OneToMany(() => Task, (t) => t.goal)
  tasks!: Task[];

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', foreignKeyConstraintName: 'fk_goals_user' })
  user!: User;

  @ManyToOne(() => Mentor, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'mentorId', foreignKeyConstraintName: 'fk_goals_mentor' })
  mentor?: Mentor;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
