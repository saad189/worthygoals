import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import {
  Goal,
  Task,
  TaskCompletion,
  TaskExplanation,
} from 'src/database/models';
import { UsersModule } from '../users/users.module';
import { AiModule } from 'src/core/ai/ai.module';
import { SafetyModule } from 'src/core/safety/safety.module';
import { MemoryModule } from 'src/core/memory/memory.module';
import { TasksController } from './tasks.controller';
import { TasksScheduler } from './tasks.scheduler';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskCompletion, TaskExplanation, Goal]),
    UsersModule,
    AiModule,
    SafetyModule,
    MemoryModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [TasksController],
  providers: [TasksService, TasksScheduler],
  exports: [TasksService],
})
export class TasksModule {}
