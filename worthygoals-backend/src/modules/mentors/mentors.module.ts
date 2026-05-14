import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MentorsController } from './mentors.controller';
import { MentorsService } from './mentors.service';
import { Mentor } from 'src/database/models';

@Module({
  imports: [TypeOrmModule.forFeature([Mentor])],
  controllers: [MentorsController],
  providers: [MentorsService],
  exports: [MentorsService],
})
export class MentorsModule {}
