import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationLog } from 'src/database/models/notification-log.entity';
import { PushToken } from 'src/database/models/push-token.entity';
import { NotificationCopyCache } from 'src/database/models/notification-copy-cache.entity';
import { PersonalityModule } from 'src/core/personalities/personality.module';
import { OpenAiProvider } from 'src/core/ai/gateway/openai.provider';
import { NotificationCopyPregenCron } from './notification-copy-pregen.cron';
import { NotificationProcessor } from './notification-processor';
import { NotificationScheduler } from './notification-scheduler.cron';
import { NotificationVoicingService } from './notification-voicing.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NOTIFICATION_QUEUE } from './types/notification-job.types';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      PushToken,
      NotificationLog,
      NotificationCopyCache,
    ]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL', 'redis://localhost:6379'),
        },
      }),
    }),
    BullModule.registerQueue({ name: NOTIFICATION_QUEUE }),
    ScheduleModule.forRoot(),
    PersonalityModule,
  ],

  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationProcessor,
    NotificationScheduler,
    NotificationVoicingService,
    NotificationCopyPregenCron,
    OpenAiProvider,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
