import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseConfiguration } from './database.config';
import { envValidationSchema } from './env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // `npm run start:dev` sets NODE_ENV=dev, so a laptop with only the
      // documented .env.local failed validation on boot. .env.local is the
      // fallback; .dockerignore excludes .env*, so it never reaches an image.
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'local'}`,
        '.env.local',
        '.env',
      ],
      validationSchema: envValidationSchema,
    }),
  ],
  providers: [ConfigService, DatabaseConfiguration],
  exports: [DatabaseConfiguration],
})
export class CustomConfigModule {}
