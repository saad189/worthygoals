import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from './account.entity';
import { Role } from './role.entity';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';
import { MessageFeedback } from './message-feedback.entity';

@Entity('users')
export class User {
  /**
   * Auto-incremented primary key
   */
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Account, (account) => account.user, {
    eager: true,
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'accountId',
    foreignKeyConstraintName: 'fk_users_account',
  })
  account: Account;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 255, nullable: true })
  firstName: string;

  @Column({ length: 255, nullable: true })
  lastName: string;

  // timestamptz hydrates as a Date; it was declared string.
  @Column({ type: 'timestamptz', nullable: true })
  dateOfBirth: Date | null;

  @Column({ type: 'char', length: 1, nullable: true })
  gender: string;

  // For now storing location as part of user entity

  @Column({ type: 'double precision', nullable: true })
  latitude: number;

  @Column({ type: 'double precision', nullable: true })
  longitude: number;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ length: 16, default: 'free' })
  tier: string;

  /**
   * Onboarding tone preference (soft | firm | intense) — the forced-choice
   * deck's result, persisted server-side so voiced surfaces (notifications,
   * personas) can scale to it. The earned-escalation slope builds on this.
   */
  @Column({ length: 16, nullable: true })
  tone: string;

  /**
   * Onboarding-matched mentor (personality slug: marcus | lyra | goggs),
   * persisted so "your mentor" survives a reinstall and is known before the
   * first goal exists — decoupled from goal.mentorId (F2). Nullable: existing
   * users fall back to the goal-derived mentor until they re-onboard.
   */
  @Column({ length: 64, nullable: true })
  personalityId: string;

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'roleId', foreignKeyConstraintName: 'fk_users_role' })
  role: Role;

  @OneToMany(() => Conversation, (c) => c.user)
  conversations!: Conversation[];

  @OneToMany(() => Message, (m) => m.user)
  messages!: Message[];

  @OneToMany(() => MessageFeedback, (f) => f.user)
  feedback!: MessageFeedback[];

  @CreateDateColumn({ type: 'timestamptz' })
  dateAdded: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  dateUpdated: Date;
}
