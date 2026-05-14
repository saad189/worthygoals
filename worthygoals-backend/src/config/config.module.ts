import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MySQLConfiguration } from './mysql.config';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `.env.${process.env.NODE_ENV || 'local'}`,
        }),
    ],
    providers: [ConfigService, MySQLConfiguration],
    exports: [MySQLConfiguration],
})
export class CustomConfigModule { }
