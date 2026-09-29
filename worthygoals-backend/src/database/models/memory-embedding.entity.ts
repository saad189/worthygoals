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
@Index('idx_memory_embeddings_user_personality_created', [
  'userId',
  'personalityId',
  'createdAt',
])
// HNSW (vector_cosine_ops) — not expressible in TypeORM, so unsynchronised.
@Index('idx_memory_embeddings_hnsw', { synchronize: false })
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

  // Written and searched via raw SQL only. Declared so migration:generate
  // stops proposing to DROP it; select/insert/update off keep the ORM from
  // ever reading or writing it.
  @Column({
    type: 'vector',
    length: 1536,
    select: false,
    insert: false,
    update: false,
  })
  embedding: number[];

  @Column({ type: 'varchar', length: 64, nullable: true })
  personalityId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
