// src/shared/cache/cache.module.ts
import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
@Module({
  imports: [NestCacheModule.register({
    ttl: 60 * 1000,
    isGlobal: true
  })],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule { }
