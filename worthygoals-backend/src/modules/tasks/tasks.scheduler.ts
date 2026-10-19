import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TasksService } from './tasks.service';
import { DataSource } from 'typeorm';
import { CRON_LOCK, runExclusive } from 'src/common/cron/run-exclusive';

@Injectable()
export class TasksScheduler {
  private readonly logger = new Logger(TasksScheduler.name);

  constructor(
    private readonly tasksService: TasksService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Hourly — spin up next instances of recurring tasks. Each user's day starts
   * at their own midnight, so there is no single right hour; and a run missed
   * while the API was down is caught up within the hour instead of a day.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async materializeRecurringTasks() {
    await runExclusive(
      this.dataSource,
      CRON_LOCK.recurringTasks,
      this.logger,
      async () => {
        const count = await this.tasksService.materializeRecurringTasks();
        this.logger.log(
          `Recurring task materializer: created ${count} new task(s)`,
        );
      },
    );
  }
}
