import { DataSource, DataSourceOptions } from 'typeorm';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({
  path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env.local',
});

const connectionOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  // Migrations still run at boot — a fresh env must never serve an unmigrated
  // schema (the S42 silent-500 landmine, F6) — but not via migrationsRun.
  // TypeORM takes no lock, so on multi-replica every instance would race the
  // same migrations at once. TypeOrmDatabaseModule runs them under a Postgres
  // advisory lock instead. The CLI (`-d dist/database/dataSource.js`) also
  // reads this file, and there migrationsRun must be off so `migration:revert`
  // does not re-apply what it just reverted.
  migrationsRun: false,
  // Full SQL logging leaks PII (emails, goal text, tokens) — opt in via DB_LOGGING (F7).
  logging: process.env.DB_LOGGING === 'true' ? true : ['error', 'warn'],
  // Managed Postgres (Railway) requires SSL; local dev doesn't — opt in via
  // DB_SSL (F11). Certificates are verified unless DB_SSL_REJECT_UNAUTHORIZED
  // is explicitly 'false': the old hard-coded rejectUnauthorized:false gave an
  // encrypted but unauthenticated connection to the production database.
  ssl:
    process.env.DB_SSL === 'true'
      ? {
          rejectUnauthorized:
            process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        }
      : false,
  // Bounds on a runaway query. Nothing was configured, so one bad scan could
  // hold a connection indefinitely and a burst could open unbounded ones.
  maxQueryExecutionTime: 1000, // logs anything slower as a warning
  extra: {
    max: Number(process.env.DB_POOL_MAX ?? 10),
    // ponytail: migrations share this pool. A future migration that builds an
    // index on a large table should start with `SET LOCAL statement_timeout = 0`
    // (migrations run in a transaction, so it stays scoped to that migration).
    statement_timeout: 30_000,
  },
  entities: [path.join(__dirname, '**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, 'migrations-pg/*{.ts,.js}')],
};

export default new DataSource({
  ...connectionOptions,
});
