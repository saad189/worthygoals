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
  // Managed Postgres (Railway) requires SSL; local dev doesn't — opt in via DB_SSL (F11).
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [path.join(__dirname, '**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, 'migrations-pg/*{.ts,.js}')],
};

export default new DataSource({
  ...connectionOptions,
});
