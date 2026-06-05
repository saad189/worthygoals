import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { GdprService } from './gdpr.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Account,
  Conversation,
  Goal,
  Message,
  Role,
  Task,
  TaskCompletion,
  TaskExplanation,
  User,
} from 'src/database/models';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      Account,
      Goal,
      Task,
      TaskCompletion,
      TaskExplanation,
      Conversation,
      Message,
    ]),
  ],
  providers: [UsersService, GdprService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
