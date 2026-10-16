import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';

/**
 * Per-user, per-UTC-day AI call counter, incremented atomically before each
 * call. Counting ai_calls rows was read-then-act, and those rows are written
 * only after the provider answers — so N parallel requests all read the same
 * count and all got through.
 */
@Entity('ai_quota_usage')
export class AiQuotaUsage {
  @PrimaryColumn({ type: 'integer' })
  userId: number;

  @PrimaryColumn({ type: 'date' })
  day: string;

  @Column({ type: 'integer', default: 0 })
  count: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'userId',
    foreignKeyConstraintName: 'fk_ai_quota_usage_user',
  })
  user?: User;
}
