import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import dataSource from 'src/database/dataSource';
import { DataSourceOptions } from 'typeorm';

@Injectable()
export class DatabaseConfiguration {
  constructor(private configService: ConfigService) {}

  get databaseConfig(): Partial<DataSourceOptions> {
    return dataSource.options;
  }
}
