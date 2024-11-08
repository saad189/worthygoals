import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomConfigModule } from './config.module';
import { MySQLConfiguration } from './mysql.config';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from 'src/database/database.service';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [CustomConfigModule],
            inject: [MySQLConfiguration, ConfigService],
            useFactory: async (configService: MySQLConfiguration, defaultConfigService: ConfigService) => {
                const databaseService = new DatabaseService(defaultConfigService);
                await databaseService.ensureDatabase();
                return {
                    ...configService.databaseConfig
                }

            },
        }),
    ],
    providers: [DatabaseService]
})
export class TypeOrmDatabaseModule { }
