import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { MemoryEmbedding } from 'src/database/models/memory-embedding.entity';
import { MemoryDigest } from 'src/database/models/memory-digest.entity';
import { EmbeddingService } from './embedding.service';
import { MemoryService } from './memory.service';
import { MemoryDigestCron } from './memory-digest.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([MemoryEmbedding, MemoryDigest]),
    ScheduleModule.forRoot(),
  ],
  providers: [EmbeddingService, MemoryService, MemoryDigestCron],
  exports: [MemoryService],
})
export class MemoryModule {}
