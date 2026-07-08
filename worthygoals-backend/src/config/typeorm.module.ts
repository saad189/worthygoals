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

  async onModuleInit() {
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
