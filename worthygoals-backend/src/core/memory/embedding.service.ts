import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import OpenAI from 'openai';
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
      const where: Record<string, unknown> = { userId };
      if (personalityId) where.personalityId = personalityId;
      if (sinceDate) where.createdAt = MoreThanOrEqual(sinceDate);

      const rows = await this.embeddingRepo.find({
        where,
        select: ['embeddingText', 'embeddingJson'],
        order: { createdAt: 'DESC' },
        take: 500,
      });

      return rows
        .map((row) => {
          try {
            const vec: number[] = JSON.parse(row.embeddingJson);
            return {
              text: row.embeddingText,
              score: EmbeddingService.cosineSimilarity(queryEmbedding, vec),
            };
          } catch {
            return null;
          }
        })
        .filter((x): x is { text: string; score: number } => x !== null)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (err: any) {
      this.logger.warn(`Vector search failed: ${err?.message}`);
      return [];
    }
  }
}
