import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { toSql } from 'pgvector';
import {
  MemoryEmbedding,
  MemorySourceType,
} from 'src/database/models/memory-embedding.entity';
import { MemoryDigest } from 'src/database/models/memory-digest.entity';
import { EmbeddingService } from './embedding.service';

const SHORT_TERM_LIMIT = 10;
const RAG_SNIPPET_LIMIT = 3;
const RAG_LOOKBACK_DAYS = 90;

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);

  constructor(
    private readonly embeddings: EmbeddingService,
    @Optional()
    @InjectRepository(MemoryEmbedding)
    private readonly embeddingRepo?: Repository<MemoryEmbedding>,
    @Optional()
    @InjectRepository(MemoryDigest)
    private readonly digestRepo?: Repository<MemoryDigest>,
  ) {}

  indexCompletion(
    userId: number,
    taskId: string,
    text: string,
    personalityId?: string,
  ): void {
    this.indexText(
      userId,
      text,
      MemorySourceType.COMPLETION,
      taskId,
      personalityId ?? null,
    ).catch((err) =>
      this.logger.warn(`indexCompletion failed: ${err?.message}`),
    );
  }

  indexExplanation(
    userId: number,
    taskId: string,
    text: string,
    personalityId?: string,
  ): void {
    this.indexText(
      userId,
      text,
      MemorySourceType.EXPLANATION,
      taskId,
      personalityId ?? null,
    ).catch((err) =>
      this.logger.warn(`indexExplanation failed: ${err?.message}`),
    );
  }

  indexMessage(
    userId: number,
    messageId: string,
    text: string,
    personalityId?: string,
  ): void {
    this.indexText(
      userId,
      text,
      MemorySourceType.MESSAGE,
      messageId,
      personalityId ?? null,
    ).catch((err) => this.logger.warn(`indexMessage failed: ${err?.message}`));
  }

  async buildContext(
    userId: number,
    personalityId: string,
    queryText: string,
  ): Promise<string> {
    if (!this.embeddingRepo || !this.digestRepo) return '';
    try {
      const [shortTerm, digest, ragSnippets] = await Promise.all([
        this.getShortTerm(userId, personalityId),
        this.getLatestDigest(userId, personalityId),
        this.getRagSnippets(userId, personalityId, queryText),
      ]);

      if (!shortTerm.length && !digest && !ragSnippets.length) return '';

      const parts: string[] = ['[Memory Context]'];

      if (shortTerm.length) {
        parts.push('--- Recent interactions ---');
        parts.push(shortTerm.join('\n'));
      }

      if (digest) {
        parts.push('--- 30-day summary ---');
        parts.push(digest);
      }

      if (ragSnippets.length) {
        parts.push('--- Related memories ---');
        ragSnippets.forEach((s) => parts.push(`• ${s}`));
      }

      parts.push('[End Memory Context]');
      return parts.join('\n');
    } catch (err: any) {
      this.logger.warn(`buildContext failed: ${err?.message}`);
      return '';
    }
  }

  private async indexText(
    userId: number,
    text: string,
    sourceType: MemorySourceType,
    sourceId: string | null,
    personalityId: string | null,
  ): Promise<void> {
    if (!this.embeddingRepo || !text.trim()) return;
    const vec = await this.embeddings.embed(text);
    if (!vec) return;

    await this.embeddingRepo.manager.query(
      `INSERT INTO memory_embeddings
         (id, "userId", "sourceType", "sourceId", "embeddingText", embedding, "personalityId", "createdAt")
       VALUES
         (gen_random_uuid(), $1, $2, $3, $4, $5::vector, $6, NOW())`,
      [userId, sourceType, sourceId, text.slice(0, 2000), toSql(vec), personalityId],
    );
  }

  private async getShortTerm(
    userId: number,
    personalityId: string,
  ): Promise<string[]> {
    if (!this.embeddingRepo) return [];
    const rows = await this.embeddingRepo.find({
      where: { userId, personalityId },
      select: ['embeddingText', 'createdAt'],
      order: { createdAt: 'DESC' },
      take: SHORT_TERM_LIMIT,
    });
    return rows.map((r) => r.embeddingText).reverse();
  }

  private async getLatestDigest(
    userId: number,
    personalityId: string,
  ): Promise<string | null> {
    if (!this.digestRepo) return null;
    const digest = await this.digestRepo.findOne({
      where: { userId, personalityId },
      order: { createdAt: 'DESC' },
    });
    return digest?.digestText ?? null;
  }

  private async getRagSnippets(
    userId: number,
    personalityId: string,
    queryText: string,
  ): Promise<string[]> {
    if (!queryText.trim()) return [];
    const queryVec = await this.embeddings.embed(queryText);
    if (!queryVec) return [];

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - RAG_LOOKBACK_DAYS);

    const results = await this.embeddings.search(
      userId,
      personalityId,
      queryVec,
      RAG_SNIPPET_LIMIT,
      sinceDate,
    );
    return results.filter((r) => r.score > 0.75).map((r) => r.text);
  }

  async getEmbeddingsForDigest(
    userId: number,
    personalityId: string,
    since: Date,
  ): Promise<string[]> {
    if (!this.embeddingRepo) return [];
    const rows = await this.embeddingRepo.find({
      where: { userId, personalityId },
      select: ['embeddingText', 'createdAt'],
      order: { createdAt: 'ASC' },
    });
    return rows.filter((r) => r.createdAt >= since).map((r) => r.embeddingText);
  }

  async saveDigest(
    userId: number,
    personalityId: string,
    digestText: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<void> {
    if (!this.digestRepo) return;
    const row = this.digestRepo.create({
      userId,
      personalityId,
      digestText,
      periodStart: periodStart.toISOString().slice(0, 10),
      periodEnd: periodEnd.toISOString().slice(0, 10),
    });
    await this.digestRepo.save(row);
  }

  async getActiveUserPersonalityPairs(): Promise<
    Array<{ userId: number; personalityId: string }>
  > {
    if (!this.embeddingRepo) return [];
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const rows = (await this.embeddingRepo
      .createQueryBuilder('e')
      .select('e.userId', 'userId')
      .addSelect('e.personalityId', 'personalityId')
      .where('e.personalityId IS NOT NULL')
      .andWhere('e.createdAt >= :since', { since })
      .groupBy('e.userId, e.personalityId')
      .getRawMany()) as Array<{ userId: number; personalityId: string }>;
    return rows;
  }
}
