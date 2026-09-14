import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { registerType } from 'pgvector/pg';
import { CustomConfigModule } from './config.module';
import { DatabaseConfiguration } from './database.config';
import { DatabaseService } from 'src/database/database.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [CustomConfigModule],
      inject: [DatabaseConfiguration, ConfigService],
      useFactory: async (
        dbConfig: DatabaseConfiguration,
        defaultConfigService: ConfigService,
      ) => {
        const databaseService = new DatabaseService(defaultConfigService);
        await databaseService.ensureDatabase();

        return {
          ...dbConfig.databaseConfig,
          // Entities co-located with their module (e.g. Media) aren't caught by
          // the src/database-rooted glob — pull in anything registered via
          // forFeature so its metadata is built. Fixes GDPR export 500.
          autoLoadEntities: true,
          seeds: ['src/database/seeds/**/*{.ts,.js}'],
          factories: ['src/database/factories/**/*{.ts,.js}'],
        };
      },
    }),
  ],
  providers: [DatabaseService],
})
export class TypeOrmDatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(TypeOrmDatabaseModule.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Postgres advisory lock id for schema migrations. Any constant works as
   * long as every replica uses the same one.
   */
  private static readonly MIGRATION_LOCK_ID = 4_919_231;

  /**
   * Run pending migrations with every other replica held off.
   *
   * This used to be `migrationsRun: true`, which TypeORM performs with no
   * lock: on a multi-replica rollout each instance raced the same migrations
   * simultaneously. pg_advisory_lock serialises them — the first replica
   * migrates, the rest block, then find nothing pending and continue.
   *
   * The lock is session-scoped, so it is released explicitly and the
   * connection returned whatever happens.
   */
  private async runMigrationsUnderLock(): Promise<void> {
    const runner = this.dataSource.createQueryRunner();
    try {
      await runner.connect();
      await runner.query('SELECT pg_advisory_lock($1)', [
        TypeOrmDatabaseModule.MIGRATION_LOCK_ID,
      ]);
      try {
        const applied = await this.dataSource.runMigrations();
        this.logger.log(
          applied.length
            ? `Applied ${applied.length} migration(s): ${applied.map((m) => m.name).join(', ')}`
            : 'Schema up to date — no migrations to apply',
        );
      } finally {
        await runner.query('SELECT pg_advisory_unlock($1)', [
          TypeOrmDatabaseModule.MIGRATION_LOCK_ID,
        ]);
      }
    } finally {
      await runner.release();
    }
  }

  async onModuleInit() {
    // Before anything reads or writes: a boot that cannot migrate must fail
    // loudly here rather than serve an unmigrated schema.
    await this.runMigrationsUnderLock();

    // Register pgvector type parser so vector columns deserialize to number[]
    try {
      const pool = (this.dataSource.driver as any).master;
      const client = await pool.connect();
      try {
        await registerType(client);
        this.logger.log('pgvector type registered');
      } finally {
        client.release();
      }
    } catch (err: any) {
      this.logger.warn(`pgvector type registration skipped: ${err?.message}`);
    }

    // Seeding is intentionally not run at boot — use the explicit `npm run seed`
    // (seed-runner.ts, upsert-by-slug + retire). Boot-time seed-if-empty never
    // reseeds a non-empty table, so it silently drifts (F8).
    if (!this.dataSource.isInitialized) {
      this.logger.error('❌ Database connection is not initialized.');
    }
  }
}
