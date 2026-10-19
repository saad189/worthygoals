import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Move the day boundary from the server's zone to the user's.
 *
 * `users.timezone` is the user's IANA zone (the app reports it whenever the
 * device's zone changes); `tasks."dueOn"` is the calendar day a task belongs
 * to. "Today" becomes `dueOn = the user's local date`, which a timezone
 * change cannot shift — a task stays on its day.
 *
 * Backfill:
 * - timezone: the newest push token's zone, where Postgres knows it; else UTC.
 * - dueOn: every existing dueDate was written as the *server's* local
 *   midnight, so its date in the server's zone is the day it meant. Reading it
 *   in the user's zone instead would move a UTC-server task to the previous
 *   day for anyone west of Greenwich.
 */
export class UserLocalDay1770000000000 implements MigrationInterface {
  name = 'UserLocalDay1770000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "timezone" character varying(64) NOT NULL DEFAULT 'UTC'`,
    );
    await queryRunner.query(`
      UPDATE users u SET timezone = pt.timezone
        FROM (SELECT DISTINCT ON ("userId") "userId", timezone
                FROM push_tokens
               WHERE timezone IS NOT NULL
               ORDER BY "userId", "updatedAt" DESC) pt
       WHERE pt."userId" = u.id
         AND pt.timezone IN (SELECT name FROM pg_timezone_names)
    `);

    await queryRunner.query(`ALTER TABLE "tasks" ADD "dueOn" date`);
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const [{ known }] = await queryRunner.query(
      `SELECT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = $1) AS known`,
      [zone],
    );
    await queryRunner.query(
      `UPDATE tasks SET "dueOn" = ("dueDate" AT TIME ZONE $1)::date
        WHERE "dueDate" IS NOT NULL`,
      [known ? zone : 'UTC'],
    );

    await queryRunner.query(
      `CREATE INDEX "idx_tasks_due_on" ON "tasks" ("dueOn") `,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tasks_recurring_due`);
    await queryRunner.query(
      `CREATE INDEX idx_tasks_recurring_due ON tasks ("dueOn")
         WHERE "repeatFrequency" <> 'none'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tasks_recurring_due`);
    await queryRunner.query(
      `CREATE INDEX idx_tasks_recurring_due ON tasks ("dueDate")
         WHERE "repeatFrequency" <> 'none'`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_tasks_due_on"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "dueOn"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "timezone"`);
  }
}
