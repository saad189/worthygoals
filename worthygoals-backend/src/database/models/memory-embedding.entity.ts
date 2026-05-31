import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum MemorySourceType {
  COMPLETION = 'completion',
  EXPLANATION = 'explanation',
  MESSAGE = 'message',
}

@Entity('memory_embeddings')
@Index(['userId', 'personalityId', 'createdAt'])
export class MemoryEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 32 })
  sourceType: MemorySourceType;

  @Column({ type: 'varchar', length: 36, nullable: true })
  sourceId: string | null;

  @Column({ type: 'text' })
  embeddingText: string;

  // embedding (vector(1536)) is managed via raw SQL — not declared here so
  // TypeORM never tries to read/write it through the ORM layer.

  @Column({ type: 'varchar', length: 64, nullable: true })
  personalityId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
