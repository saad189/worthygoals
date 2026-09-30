import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('notification_copy_cache')
@Unique('uq_notif_copy_cache', ['personalityId', 'event', 'day', 'contextHash'])
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

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
