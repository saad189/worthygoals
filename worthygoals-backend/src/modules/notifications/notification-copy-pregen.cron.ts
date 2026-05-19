import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationVoicingService } from './notification-voicing.service';

@Injectable()
export class NotificationCopyPregenCron {
  private readonly logger = new Logger(NotificationCopyPregenCron.name);

  constructor(private readonly voicingService: NotificationVoicingService) {}

  // Runs at midnight UTC — pre-generates morning + evening copy for the next day.
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async pregenNextDay(): Promise<void> {
    this.logger.log('Starting notification copy pre-generation for next day');
    try {
      await this.voicingService.preGenerateForNextDay();
      this.logger.log('Notification copy pre-generation complete');
    } catch (err: any) {
      this.logger.error(
        `Notification copy pre-generation failed: ${err?.message}`,
      );
    }
  }
}
