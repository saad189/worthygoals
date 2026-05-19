import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { NotificationJobKind } from 'src/modules/notifications/types/notification-job.types';

@Entity('notification_logs')
@Index(['userId', 'sentDate'])
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 32 })
  kind: NotificationJobKind;

  @Column({ type: 'varchar', length: 10 })
  sentDate: string; // YYYY-MM-DD in user's local timezone

  @Column({ nullable: true, length: 512 })
  token: string;

  @Column({ default: 'sent' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
