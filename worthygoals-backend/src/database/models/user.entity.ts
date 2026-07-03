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
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column()
  email: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ type: 'timestamptz', nullable: true })
  dateOfBirth: string;

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

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  role: Role;

  @OneToMany(() => Conversation, (c) => c.user)
  conversations!: Conversation[];

  @OneToMany(() => Message, (m) => m.user)
  messages!: Message[];

  @OneToMany(() => MessageFeedback, (f) => f.user)
  feedback!: MessageFeedback[];

  @CreateDateColumn()
  dateAdded: Date;

  @UpdateDateColumn()
  dateUpdated: Date;
}
