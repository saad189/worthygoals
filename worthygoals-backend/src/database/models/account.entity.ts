import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';
import { MessageFeedback } from './message-feedback.entity';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  // This uniquely identifies the account from Cognito
  @Column({ type: 'uuid', unique: true })
  sub: string;

  @Column({ unique: true })
  email: string;

  // Include any other account-level fields if necessary
  @Column({ nullable: true, default: false })
  isSignUp: boolean;

  @OneToOne(() => User, (user) => user.account, { cascade: true })
  user: User;

  @CreateDateColumn()
  dateAdded: Date;

  @UpdateDateColumn()
  dateUpdated: Date;
}
