import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Schema half of the ECC-1 high findings.
 *
 * H5 — five tables carried userId with no foreign key (ai_calls,
 * memory_embeddings, memory_digests, push_tokens, notification_logs), so GDPR
 * erasure rested on one hand-written purge block; any other deletion path
 * orphaned rows, including up to 2000 chars of raw user text per embedding.
 * They now cascade from users. Each FK is added NOT VALID and then validated,
 * so the scan does not hold an exclusive lock on the table. System AI calls
 * used a -1 sentinel userId, which no FK accepts; ai_calls.userId becomes
 * nullable and those rows NULL. Pre-existing orphans are removed first —
 * they belong to users who no longer exist.
 *
 * H2 — the nightly recurring-task job needs "completed, repeating, overdue"
 * (a partial index) and "does this task already have its next occurrence"
 * (an index on the soft parent reference).
 *
 * H6 — the HNSW index is global and knows nothing about userId/personalityId,
 * so a filtered nearest-neighbour query could walk ~40 global neighbours,
 * filter them all away, and return nothing, silently. Dropped: the filtered
 * search becomes an exact scan over idx_memory_embeddings_user_personality_created,
 * which is correct by construction at per-user volumes.
 */
const FK_TABLES = [
  'memory_embeddings',
  'memory_digests',
  'push_tokens',
  'notification_logs',
  'ai_calls',
] as const;

export class EccOneHighs1769700000000 implements MigrationInterface {
  name = 'EccOneHighs1769700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── H5 ──────────────────────────────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE ai_calls ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `UPDATE ai_calls SET "userId" = NULL WHERE "userId" <= 0`,
    );
    for (const table of FK_TABLES) {
      await queryRunner.query(
        `DELETE FROM ${table} x
          WHERE x."userId" IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = x."userId")`,
      );
      await queryRunner.query(
        `ALTER TABLE ${table} ADD CONSTRAINT fk_${table}_user
           FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE NOT VALID`,
      );
      await queryRunner.query(
        `ALTER TABLE ${table} VALIDATE CONSTRAINT fk_${table}_user`,
      );
    }

    // ── H2 ──────────────────────────────────────────────────────────────────
    await queryRunner.query(
      `CREATE INDEX idx_tasks_recurring_due ON tasks ("dueDate")
         WHERE status = 'completed' AND "repeatFrequency" <> 'none'`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_tasks_parent_occurrence ON tasks ("parentTaskId", "occurrenceIndex")`,
    );

    // ── H6 ──────────────────────────────────────────────────────────────────
    await queryRunner.query(`DROP INDEX IF EXISTS idx_memory_embeddings_hnsw`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX idx_memory_embeddings_hnsw ON memory_embeddings USING hnsw (embedding vector_cosine_ops)`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tasks_parent_occurrence`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tasks_recurring_due`);
    for (const table of [...FK_TABLES].reverse()) {
      await queryRunner.query(
        `ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS fk_${table}_user`,
      );
    }
    // System calls go back to the -1 sentinel so NOT NULL can be restored.
    await queryRunner.query(
      `UPDATE ai_calls SET "userId" = -1 WHERE "userId" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE ai_calls ALTER COLUMN "userId" SET NOT NULL`,
    );
  }
}
