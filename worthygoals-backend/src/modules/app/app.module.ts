import { Module, ValidationPipe } from '@nestjs/common';
import { GLOBAL_VALIDATION_PIPE_OPTIONS } from 'src/common/validation-pipe.options';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { HealthController } from './health.controller';
import { AppService } from './app.service';
import { CoreModule } from 'src/core';
import { CustomConfigModule, TypeOrmDatabaseModule } from 'src/config';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { MentorsModule } from '../mentors/mentors.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { MessagesModule } from '../messages/messages.module';
import { GoalsModule } from '../goals/goals.module';
import { TasksModule } from '../tasks/tasks.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { MediaModule } from '../media/media.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BoardModule } from '../board/board.module';
import { StatusModule } from '../status/status.module';
import { WeeklyReviewModule } from '../weekly-review/weekly-review.module';
import { AppThrottlerGuard } from 'src/common/guards/throttler-ws.guard';

const modules = [
  UsersModule,
  AuthModule,
  MentorsModule,
  ConversationsModule,
  MessagesModule,
  GoalsModule,
  MediaModule,
  TasksModule,
  DashboardModule,
  NotificationsModule,
  BoardModule,
  StatusModule,
  WeeklyReviewModule,
];

@Module({
  imports: [
    CustomConfigModule,
    TypeOrmDatabaseModule,
    // Global rate limiting: 100 requests per 60 seconds per IP
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    ...modules,
    CoreModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe(GLOBAL_VALIDATION_PIPE_OPTIONS),
    },
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule {}
