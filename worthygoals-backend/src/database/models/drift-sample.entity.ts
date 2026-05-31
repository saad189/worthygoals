import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('drift_samples')
export class DriftSample {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'personality_id', type: 'varchar', length: 64, nullable: true })
  personalityId: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  event: string | null;

  @Column({ name: 'user_message', type: 'text', nullable: true })
  userMessage: string | null;

  @Column({ type: 'text' })
  output: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  model: string | null;

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
