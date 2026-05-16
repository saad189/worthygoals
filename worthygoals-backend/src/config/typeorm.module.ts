import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import { DataSource } from 'typeorm';
import { CustomConfigModule } from './config.module';
import { MySQLConfiguration } from './mysql.config';
import { DatabaseService } from 'src/database/database.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [CustomConfigModule],
      inject: [MySQLConfiguration, ConfigService],
      useFactory: async (
        configService: MySQLConfiguration,
        defaultConfigService: ConfigService,
      ) => {
        const databaseService = new DatabaseService(defaultConfigService);
        await databaseService.ensureDatabase();

        return {
          ...configService.databaseConfig,
          seeds: ['src/database/seeds/**/*{.ts,.js}'],
          factories: ['src/database/factories/**/*{.ts,.js}'],
        };
      },
    }),
  ],
  providers: [DatabaseService],
})
export class TypeOrmDatabaseModule implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    if (this.dataSource.isInitialized) {
      console.log('🚀 Running seeders on server startup...');
      try {
        //  await runSeeders(this.dataSource); // Use the existing connection
        console.log('✅ Seeding completed successfully.');
      } catch (error) {
        console.error('❌ Seeding failed:', error);
      }
    } else {
      console.error(
        '❌ Database connection is not initialized. Skipping seeding.',
      );
    }
  }
}
