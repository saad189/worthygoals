import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { StatusReaction } from './status-reaction.entity';

/**
 * A free-text status the user broadcasts to "the team" (Hi-Fi flow ⑤).
 * One post fans out to one in-voice reaction per personality
 * ({@link StatusReaction}) — the polyphonic feed.
 */
@Entity({ name: 'status_posts' })
@Index('idx_status_posts_user_created_at', ['userId', 'createdAt'])
export class StatusPost {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user!: User;

  @Column({ type: 'text' })
  text!: string;

  /** Optional photo (screen 12's 📷 chip) — media drafts table id. */
  @Column({ type: 'uuid', nullable: true })
  mediaId!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => StatusReaction, (r) => r.status)
  reactions!: StatusReaction[];
}
