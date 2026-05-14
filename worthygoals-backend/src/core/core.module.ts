// src/core/core.module.ts
import { Module } from '@nestjs/common';
import { CacheModule } from './cache/cache.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [CacheModule, AiModule],
  exports: [CacheModule, AiModule],
})
export class CoreModule {}
