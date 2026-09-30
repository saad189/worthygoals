import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

export type PushPlatform = 'expo' | 'fcm' | 'apns';

@Entity('push_tokens')
@Unique('uq_push_tokens_user_token', ['userId', 'token'])
@Index('idx_push_tokens_user_active', ['userId', 'active'])
export class PushToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: number;

  @Column({ length: 512 })
  token: string;

  @Column({ type: 'varchar', length: 16, default: 'expo' })
  platform: PushPlatform;

  @Column({ nullable: true, length: 64 })
  timezone: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
