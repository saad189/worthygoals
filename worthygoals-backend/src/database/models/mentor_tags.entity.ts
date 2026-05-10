import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Mentor } from './mentor.entity';

@Entity('mentor_tags')
export class MentorTagEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  slug: string; // e.g. "career", "quran", "fitness"

  @Column({ type: 'varchar', length: 128 })
  label: string;

  @ManyToMany(() => Mentor, (m) => m.tags)
  mentors: Mentor[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
