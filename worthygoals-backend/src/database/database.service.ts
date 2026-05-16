import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createConnection } from 'mysql2/promise';

@Injectable()
export class DatabaseService {
  constructor(private readonly configService: ConfigService) {}

  public async ensureDatabase() {
    const host = this.configService.get<string>('DB_HOST');
    const port = this.configService.get<number>('DB_PORT');
    const user = this.configService.get<string>('DB_USERNAME');
    const password = this.configService.get<string>('DB_PASSWORD');
    const database = this.configService.get<string>('DB_NAME');

    try {
      const connection = await createConnection({ host, port, user, password });
      console.log(`Connected to MySQL server at ${host}:${port}`);
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
      console.log(`Database ${database} created or already exists.`);
      await connection.end();
    } catch (error) {
      console.error('Error creating database:', error);
    }
  }
}
