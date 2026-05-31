import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { toSql } from 'pgvector';
import { MemoryEmbedding } from 'src/database/models/memory-embedding.entity';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly client: OpenAI | null;
  private readonly model: string;

  constructor(
    private readonly config: ConfigService,
    @Optional()
    @InjectRepository(MemoryEmbedding)
    private readonly embeddingRepo?: Repository<MemoryEmbedding>,
  ) {
    const apiKey = config.get<string>('OPENAI_API_KEY');
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
    this.model =
      config.get<string>('EMBEDDING_MODEL') ?? 'text-embedding-3-small';
  }

  get available(): boolean {
    return !!this.client;
  }

  async embed(text: string): Promise<number[] | null> {
    if (!this.client) return null;
    try {
      const res = await this.client.embeddings.create({
        model: this.model,
        input: text.slice(0, 8000),
      });
      return res.data[0].embedding;
    } catch (err: any) {
      this.logger.warn(`Embedding failed: ${err?.message}`);
      return null;
    }
  }

  // Kept for tests and as a fallback utility.
  static cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  async search(
    userId: number,
    personalityId: string | null,
    queryEmbedding: number[],
    limit: number,
    sinceDate?: Date,
  ): Promise<Array<{ text: string; score: number }>> {
    if (!this.embeddingRepo) return [];
    try {
      const vecStr = toSql(queryEmbedding);
      const params: unknown[] = [vecStr, userId];
      const conditions: string[] = [`"userId" = $2`];

      if (personalityId) {
        conditions.push(`"personalityId" = $${params.length + 1}`);
        params.push(personalityId);
      }
      if (sinceDate) {
        conditions.push(`"createdAt" >= $${params.length + 1}`);
        params.push(sinceDate);
      }
      const limitIdx = params.length + 1;
      params.push(limit);

      const rows = await this.embeddingRepo.manager.query<
        Array<{ embeddingText: string; score: string }>
      >(
        `SELECT "embeddingText", 1 - (embedding <=> $1::vector) AS score
         FROM memory_embeddings
         WHERE ${conditions.join(' AND ')}
         ORDER BY embedding <=> $1::vector
         LIMIT $${limitIdx}`,
        params,
      );

      return rows.map((r) => ({
        text: r.embeddingText,
        score: parseFloat(r.score),
      }));
    } catch (err: any) {
      this.logger.warn(`Vector search failed: ${err?.message}`);
      return [];
    }
  }
}
