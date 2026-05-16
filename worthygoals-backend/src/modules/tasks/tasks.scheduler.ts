import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TasksService } from './tasks.service';

@Injectable()
export class TasksScheduler {
  private readonly logger = new Logger(TasksScheduler.name);

  constructor(private readonly tasksService: TasksService) {}

  /** Runs every day at 01:00 UTC — spin up next instances of recurring tasks */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async materializeRecurringTasks() {
    const count = await this.tasksService.materializeRecurringTasks();
    this.logger.log(`Recurring task materializer: created ${count} new task(s)`);
  }
}
