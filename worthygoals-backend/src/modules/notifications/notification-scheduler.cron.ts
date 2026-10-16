import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { DataSource } from 'typeorm';
import { CRON_LOCK, runExclusive } from 'src/common/cron/run-exclusive';

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(
    private readonly notifService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async materialize(): Promise<void> {
    await runExclusive(
      this.dataSource,
      CRON_LOCK.notificationMaterialize,
      this.logger,
      async () => {
        this.logger.log('Materializing next 24h of notification jobs');
        await this.notifService.materializeNext24h();
      },
    );
  }

  // Once a day is enough — the lapse threshold is measured in days, and the
  // service itself enforces the weekly resend guard.
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async lapseReEngagement(): Promise<void> {
    await runExclusive(
      this.dataSource,
      CRON_LOCK.notificationLapse,
      this.logger,
      async () => {
        this.logger.log('Scanning for lapsed users (re_engage)');
        await this.notifService.scheduleLapseReEngagement();
      },
    );
  }
}
