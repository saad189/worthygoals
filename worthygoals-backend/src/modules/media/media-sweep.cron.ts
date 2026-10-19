import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { CRON_LOCK, runExclusive } from 'src/common/cron/run-exclusive';
import { MediaService } from './media.service';

@Injectable()
export class MediaSweepCron {
  private readonly logger = new Logger(MediaSweepCron.name);

  constructor(
    private readonly media: MediaService,
    private readonly dataSource: DataSource,
  ) {}

  /** Nightly: delete uploads nothing references (see sweepOrphans). */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async sweep(): Promise<void> {
    await runExclusive(
      this.dataSource,
      CRON_LOCK.mediaSweep,
      this.logger,
      async () => {
        const swept = await this.media.sweepOrphans();
        this.logger.log(`Orphan media sweep: deleted ${swept} upload(s)`);
      },
    );
  }
}
