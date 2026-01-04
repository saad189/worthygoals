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

  @Column({ type: 'datetime', nullable: true })
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
