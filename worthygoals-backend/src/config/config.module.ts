import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseConfiguration } from './database.config';
import { envValidationSchema } from './env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'local'}`, '.env'],
      validationSchema: envValidationSchema,
    }),
  ],
  providers: [ConfigService, DatabaseConfiguration],
  exports: [DatabaseConfiguration],
})
export class CustomConfigModule {}
