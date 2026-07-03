import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(private readonly notifService: NotificationsService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async materialize(): Promise<void> {
    this.logger.log('Materializing next 24h of notification jobs');
    await this.notifService.materializeNext24h();
  }

  // Once a day is enough — the lapse threshold is measured in days, and the
  // service itself enforces the weekly resend guard.
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async lapseReEngagement(): Promise<void> {
    this.logger.log('Scanning for lapsed users (re_engage)');
    await this.notifService.scheduleLapseReEngagement();
  }
}
