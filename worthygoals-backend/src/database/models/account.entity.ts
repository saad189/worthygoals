import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity('accounts')
@Unique('uq_accounts_email', ['email'])
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  // This uniquely identifies the account from Cognito
  @Column({ type: 'uuid', unique: true })
  sub: string;

  @Column({ length: 255 })
  email: string;

  // Include any other account-level fields if necessary
  @Column({ nullable: true, default: false })
  isSignUp: boolean;

  @OneToOne(() => User, (user) => user.account, { cascade: true })
  user: User;

  @CreateDateColumn({ type: 'timestamptz' })
  dateAdded: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  dateUpdated: Date;
}
