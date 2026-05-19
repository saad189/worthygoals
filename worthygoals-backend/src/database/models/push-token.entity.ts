import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type PushPlatform = 'expo' | 'fcm' | 'apns';

@Entity('push_tokens')
@Index(['userId', 'token'], { unique: true })
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
