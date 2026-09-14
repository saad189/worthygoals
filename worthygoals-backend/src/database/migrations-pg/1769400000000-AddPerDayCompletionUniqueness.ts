import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Back per-day idempotency with a real constraint.
 *
 * `tasks.service.ts` enforced "one completion per task per day" with a
 * read-then-write and no transaction: SELECT for today's row, then INSERT.
 * Two taps that interleave between those statements both see nothing and both
 * insert — double-counting the streak, double-firing indexCompletion and
 * double-charging an AI call. None of the seven existing migrations put a
 * UNIQUE on either table.
 *
 * The date expression is `("createdAt" AT TIME ZONE 'UTC')::date` rather than
 * `"createdAt"::date`, because casting a timestamptz to date depends on the
 * session TimeZone and Postgres rejects non-immutable expressions in an index.
 *
 * ponytail: the day boundary is therefore UTC, matching what the application
 * code did with server-local midnight — neither is the user's own midnight.
 * push_tokens.timezone already carries the user's zone; moving the boundary
 * there means storing a resolved local date column to index on, and is a
 * behaviour change for existing users rather than a fix to this race.
 *
 * Pre-existing duplicates would block index creation, so they are collapsed
 * first, oldest row winning.
 */
export class AddPerDayCompletionUniqueness1769400000000
  implements MigrationInterface
{
  name = 'AddPerDayCompletionUniqueness1769400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['task_completions', 'task_explanations']) {
      await queryRunner.query(`
        DELETE FROM ${table} t
        USING ${table} keep
        WHERE t."taskId" = keep."taskId"
          AND ("t"."createdAt" AT TIME ZONE 'UTC')::date
              = ("keep"."createdAt" AT TIME ZONE 'UTC')::date
          AND (t."createdAt", t.id) > (keep."createdAt", keep.id)
      `);
    }

    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_task_completions_task_day
      ON task_completions ("taskId", (("createdAt" AT TIME ZONE 'UTC')::date))
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_task_explanations_task_day
      ON task_explanations ("taskId", (("createdAt" AT TIME ZONE 'UTC')::date))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS uq_task_explanations_task_day`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS uq_task_completions_task_day`);
  }
}
