import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { NotificationJobKind } from 'src/modules/notifications/types/notification-job.types';

@Entity('notification_logs')
@Index('idx_notification_logs_user_date', ['userId', 'sentDate'])
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 32 })
  kind: NotificationJobKind;

  // DATE (was VARCHAR(10)). TypeORM hydrates a date column as a yyyy-MM-dd
  // string, so the type stays string.
  @Column({ type: 'date' })
  sentDate: string; // YYYY-MM-DD in user's local timezone

  @Column({ nullable: true, length: 512 })
  token: string;

  @Column({ type: 'varchar', length: 32, default: 'sent' })
  status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'userId',
    foreignKeyConstraintName: 'fk_notification_logs_user',
  })
  user?: User;
}
