import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { MediaController } from './media.controller';
import { Media } from 'src/database/models/media.entity';
import { MediaService } from './media.service';
import { MediaSweepCron } from './media-sweep.cron';

@Module({
  imports: [TypeOrmModule.forFeature([Media]), UsersModule],
  controllers: [MediaController],
  providers: [MediaService, MediaSweepCron],
  exports: [MediaService],
})
export class MediaModule {}
