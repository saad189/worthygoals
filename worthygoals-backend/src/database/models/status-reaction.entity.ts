import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StatusPost } from './status-post.entity';

/**
 * One personality's in-voice reply to a {@link StatusPost}. Three of these
 * (marcus / lyra / goggs) make up the polyphonic feed for a single status.
 */
@Entity({ name: 'status_reactions' })
@Index('idx_status_reactions_status_id', ['statusId'])
export class StatusReaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  statusId!: string;

  @ManyToOne(() => StatusPost, (s) => s.reactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'statusId', referencedColumnName: 'id' })
  status!: StatusPost;

  /** personalityId slug (marcus / lyra / goggs) — the YAML runtime identity. */
  @Column({ type: 'varchar', length: 64 })
  personalityId!: string;

  /** Display name captured at reaction time. */
  @Column({ type: 'varchar', length: 64 })
  mentorName!: string;

  @Column({ type: 'text' })
  text!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
