import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('memory_digests')
@Index(['userId', 'personalityId', 'createdAt'])
export class MemoryDigest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 64 })
  personalityId: string;

  @Column({ type: 'text' })
  digestText: string;

  @Column({ type: 'date' })
  periodStart: string;

  @Column({ type: 'date' })
  periodEnd: string;

  @CreateDateColumn()
  createdAt: Date;
}
