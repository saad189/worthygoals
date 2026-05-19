import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Goal, Task, TaskCompletion } from 'src/database/models';
import { UsersModule } from '../users/users.module';
import { MediaModule } from '../media/media.module';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Goal, Task, TaskCompletion]),
    UsersModule,
    MediaModule,
  ],
  controllers: [BoardController],
  providers: [BoardService],
})
export class BoardModule {}
