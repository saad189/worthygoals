import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Advisory-lock ids for the in-process @Cron jobs. Any constant works as long
 * as every replica uses the same one and none collide (the migration lock is
 * 4_919_231, in TypeOrmDatabaseModule).
 */
export const CRON_LOCK = {
  notificationMaterialize: 4_919_301,
  notificationLapse: 4_919_302,
  notificationCopyPregen: 4_919_303,
  recurringTasks: 4_919_304,
  memoryDigest: 4_919_305,
} as const;

/**
 * Run a cron body on at most one replica.
 *
 * @nestjs/schedule fires on every instance. At one replica that is fine; at
 * two, every user got every scheduled push twice and the copy pre-generation
 * and memory digest paid for their AI calls twice. pg_try_advisory_lock lets
 * the first replica through and the rest skip — no waiting, no new dependency.
 *
 * The lock is session-scoped, so it is held on one dedicated connection and
 * released on the same one.
 */
export async function runExclusive(
  dataSource: DataSource,
  lockId: number,
  logger: Logger,
  fn: () => Promise<void>,
): Promise<void> {
  const runner = dataSource.createQueryRunner();
  try {
    await runner.connect();
    const [{ locked }] = await runner.query(
      'SELECT pg_try_advisory_lock($1) AS locked',
      [lockId],
    );
    if (!locked) {
      logger.debug('Another instance holds this cron — skipping');
      return;
    }
    try {
      await fn();
    } finally {
      await runner.query('SELECT pg_advisory_unlock($1)', [lockId]);
    }
  } finally {
    await runner.release();
  }
}
