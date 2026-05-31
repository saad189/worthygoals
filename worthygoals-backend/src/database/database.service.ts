import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly configService: ConfigService) {}

  public async ensureDatabase() {
    const host = this.configService.get<string>('DB_HOST');
    const port = this.configService.get<number>('DB_PORT');
    const user = this.configService.get<string>('DB_USERNAME');
    const password = this.configService.get<string>('DB_PASSWORD');
    const database = this.configService.get<string>('DB_NAME');

    const client = new Client({
      host,
      port,
      user,
      password,
      database: 'postgres',
    });
    try {
      await client.connect();
      const result = await client.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [database],
      );
      if (result.rows.length === 0) {
        // Database name from env — strip non-identifier chars to prevent injection
        const safeName = (database ?? '').replace(/[^a-zA-Z0-9_]/g, '');
        await client.query(`CREATE DATABASE ${safeName}`);
        this.logger.log(`Database ${safeName} created.`);
      } else {
        this.logger.log(`Database ${database} already exists.`);
      }
    } catch (error: any) {
      this.logger.error(`Error ensuring database: ${error?.message}`);
    } finally {
      await client.end();
    }
  }
}
