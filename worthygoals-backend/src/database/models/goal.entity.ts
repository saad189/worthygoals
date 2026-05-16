import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GoalCategory, GoalStatus } from 'src/common/constants';
import { User } from './user.entity';
import { Mentor } from './mentor.entity';

@Entity('goals')
@Index('idx_goals_user_id', ['userId'])
@Index('idx_goals_user_status', ['userId', 'status'])
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

  @Column({ type: 'enum', enum: GoalCategory, default: GoalCategory.POWER })
  category!: GoalCategory;

  @Column({ type: 'enum', enum: GoalStatus, default: GoalStatus.ACTIVE })
  status!: GoalStatus;

  @Column({ type: 'text', nullable: true })
  costText?: string;

  @Column({ type: 'text', nullable: true })
  benefitText?: string;

  @Column({ type: 'text', nullable: true })
  failureText?: string;

  @Column({ type: 'datetime', nullable: true })
  deadline?: Date;

  @Column({ type: 'json', nullable: true })
  repeatRule?: Record<string, unknown>;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  stakeAmount?: number;

  @Column({ length: 512, nullable: true })
  imageUri?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Mentor, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'mentorId' })
  mentor?: Mentor;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
