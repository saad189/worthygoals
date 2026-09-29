import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { GdprService } from './gdpr.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Account,
  AiCall,
  Conversation,
  Goal,
  MemoryDigest,
  MemoryEmbedding,
  Message,
  NotificationLog,
  PushToken,
  Role,
  Task,
  TaskCompletion,
  TaskExplanation,
  User,
  UserPersonality,
} from 'src/database/models';
import { Media } from '../media/media.entity';
import { AuthModule } from '../auth/auth.module';

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
      UserPersonality,
      MemoryDigest,
      MemoryEmbedding,
      PushToken,
      NotificationLog,
      AiCall,
      Media,
    ]),
    AuthModule,
  ],
  providers: [UsersService, GdprService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
