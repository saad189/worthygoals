import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('notification_copy_cache')
@Index(['personalityId', 'event', 'day', 'contextHash'], { unique: true })
export class NotificationCopyCache {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 32 })
  personalityId: string;

  @Column({ length: 48 })
  event: string;

  @Column({ length: 10 })
  day: string; // YYYY-MM-DD UTC

  @Column({ length: 32 })
  contextHash: string;

  @Column({ type: 'text' })
  body: string;

  // Reserved for future A/B testing of notification copy variants.
  @Column({ length: 8, default: 'A' })
  abVariant: string;

  @CreateDateColumn()
  createdAt: Date;
}
