import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import dataSource from 'src/database/dataSource';
import { DataSourceOptions } from 'typeorm';

@Injectable()
export class MySQLConfiguration {
    constructor(private configService: ConfigService) { }

    get isDevelopment(): boolean {
        return this.configService.get<string>('NODE_ENV') === 'dev';
    }

    get isLocal(): boolean {
        return this.configService.get<string>('NODE_ENV') === 'local';
    }

    get databaseConfig(): Partial<DataSourceOptions> {
        return dataSource.options;
    }
}
