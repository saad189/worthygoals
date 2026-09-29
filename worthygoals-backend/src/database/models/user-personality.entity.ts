import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_personalities')
@Index('idx_user_personalities_user_id', ['userId'])
export class UserPersonality {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ length: 64 })
  personalityId: string;

  @Column({ type: 'jsonb', default: '{}' })
  relationshipState: Record<string, unknown>;

  @Column({ type: 'float', default: 0.0 })
  escalationSlope: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  activatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'userId',
    foreignKeyConstraintName: 'fk_user_personalities_user',
  })
  user: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
