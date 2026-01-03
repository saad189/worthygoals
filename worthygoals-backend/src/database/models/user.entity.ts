import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';

@Entity('users')
export class User {
  /**
   * Auto-incremented primary key
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * We'll store the Cognito 'sub' (the unique UUID that Cognito assigns each user)
   * as a unique column in our user table.
   */
  @Column({ type: 'varchar', length: 255, unique: true })
  sub: string; // Cognito 'sub'

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

  @CreateDateColumn()
  dateAdded: Date;

  @UpdateDateColumn()
  dateUpdated: Date;
}
