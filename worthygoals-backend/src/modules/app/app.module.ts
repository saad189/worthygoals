import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EntitySchema } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_PIPE } from '@nestjs/core';
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
];
const entities = [
  __dirname + '/**/*.entity{.ts,.js}',
] as unknown as EntitySchema[];
@Module({
  imports: [
    CustomConfigModule,
    TypeOrmDatabaseModule,
    ...modules,
    TypeOrmModule.forFeature(entities),
    CoreModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
