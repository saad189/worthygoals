import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * materializeRecurringTasks now rolls a repeating task forward whatever its
 * status — missed and skipped days included, not only completed ones — so the
 * partial index it scans drops the status predicate.
 */
export class RecurringIndexAnyStatus1769900000000
  implements MigrationInterface
{
  name = 'RecurringIndexAnyStatus1769900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tasks_recurring_due`);
    await queryRunner.query(
      `CREATE INDEX idx_tasks_recurring_due ON tasks ("dueDate")
         WHERE "repeatFrequency" <> 'none'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tasks_recurring_due`);
    await queryRunner.query(
      `CREATE INDEX idx_tasks_recurring_due ON tasks ("dueDate")
         WHERE status = 'completed' AND "repeatFrequency" <> 'none'`,
    );
  }
}
