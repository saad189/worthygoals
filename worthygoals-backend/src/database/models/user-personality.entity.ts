import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_personalities')
export class UserPersonality {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ length: 64 })
  personalityId: string;

  @Column({ type: 'json', default: '{}' })
  relationshipState: Record<string, unknown>;

  @Column({ type: 'float', default: 0.0 })
  escalationSlope: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  activatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
