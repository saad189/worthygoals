import { parseLimit } from 'src/common/pagination';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Repository } from 'typeorm';
import {
  Task,
  TaskCompletion,
  TaskExplanation,
  Goal,
} from 'src/database/models';
import { TaskRepeatFrequency, TaskStatus } from 'src/common/constants';
import { UsersService } from '../users/users.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { ExplainTaskDto } from './dto/explain-task.dto';
import { AiGatewayService } from 'src/core/ai/gateway/ai-gateway.service';
import { SafetyService } from 'src/core/safety/safety.service';
import { MemoryService } from 'src/core/memory/memory.service';

export interface TaskReactionResult<T> {
  data: T;
  mentorReaction?: string;
  safetyFlag?: boolean;
}

/** Postgres unique_violation. */
const UNIQUE_VIOLATION = '23505';

const RECURRING_PAGE_SIZE = 500;

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  /**
   * Runs an insert and turns Postgres' unique_violation into the 409 the
   * caller means.
   *
   * 23505 is the only outcome the per-day indexes can produce here, and it is
   * the authoritative answer: unlike a preceding SELECT, it cannot be raced.
   */
  private async insertOrConflict<T>(
    insert: () => Promise<T>,
    conflictMessage: string,
  ): Promise<T> {
    try {
      return await insert();
    } catch (error: any) {
      if (error?.code === UNIQUE_VIOLATION) {
        throw new ConflictException(conflictMessage);
      }
      throw error;
    }
  }

  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(TaskCompletion)
    private readonly completionRepo: Repository<TaskCompletion>,
    @InjectRepository(TaskExplanation)
    private readonly explanationRepo: Repository<TaskExplanation>,
    @InjectRepository(Goal)
    private readonly goalRepo: Repository<Goal>,
    private readonly usersService: UsersService,
    // M-3: the crisis classifier must never be silently absent — required.
    private readonly safetyService: SafetyService,
    @Optional() private readonly aiGateway?: AiGatewayService,
    @Optional() private readonly memoryService?: MemoryService,
  ) {
    if (!this.aiGateway) {
      this.logger.warn(
        'AiGatewayService not injected — mentor reactions disabled',
      );
    }
    if (!this.memoryService) {
      this.logger.warn(
        'MemoryService not injected — completion/explanation indexing disabled',
      );
    }
  }

  async create(sub: string, dto: CreateTaskDto): Promise<Task> {
    const user = await this.resolveUser(sub);
    const goal = await this.goalRepo.findOne({ where: { id: dto.goalId } });
    if (!goal) throw new NotFoundException(`Goal ${dto.goalId} not found`);
    if (goal.userId !== user.id) throw new ForbiddenException();

    const task = this.taskRepo.create(dto);
    return this.taskRepo.save(task);
  }

  async findAllForGoal(
    sub: string,
    goalId: string,
    limit?: string,
  ): Promise<Task[]> {
    const user = await this.resolveUser(sub);
    // Postgres throws on a non-UUID literal compared to a uuid column, which
    // would surface as a 500. Treat a malformed id as "not found" instead.
    if (!isUUID(goalId))
      throw new NotFoundException(`Goal ${goalId} not found`);
    const goal = await this.goalRepo.findOne({ where: { id: goalId } });
    if (!goal) throw new NotFoundException(`Goal ${goalId} not found`);
    if (goal.userId !== user.id) throw new ForbiddenException();

    // Recurring goals grow a task a day, so this is bounded. Take the latest
    // N by due date and hand them back oldest-first, the order the app shows.
    const latest = await this.taskRepo.find({
      where: { goalId },
      order: { dueDate: 'DESC', createdAt: 'DESC' },
      take: parseLimit(limit, { fallback: 100, max: 500 }),
    });
    return latest.reverse();
  }

  async findOne(sub: string, taskId: string): Promise<Task> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
    await this.assertGoalOwnership(sub, task.goalId);
    return task;
  }

  async update(sub: string, taskId: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
    await this.assertGoalOwnership(sub, task.goalId);
    // dueDate arrives as an ISO string (@IsDateString) for a Date column. The
    // old `as unknown as Partial<Task>` cast hid that and left a string on
    // task.dueDate until the round-trip.
    const { dueDate, ...rest } = dto;
    this.taskRepo.merge(task, {
      ...rest,
      ...(dueDate !== undefined ? { dueDate: new Date(dueDate) } : {}),
    });
    return this.taskRepo.save(task);
  }

  async remove(sub: string, taskId: string): Promise<void> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
    await this.assertGoalOwnership(sub, task.goalId);
    await this.taskRepo.remove(task);
  }

  async complete(
    sub: string,
    taskId: string,
    dto: CompleteTaskDto,
  ): Promise<TaskReactionResult<TaskCompletion>> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);

    const user = await this.resolveUser(sub);
    const goal = await this.goalRepo.findOne({ where: { id: task.goalId } });
    if (!goal) throw new NotFoundException(`Goal ${task.goalId} not found`);
    if (goal.userId !== user.id) throw new ForbiddenException();

    // Idempotency is enforced by uq_task_completions_task_day. The previous
    // read-then-write ran outside a transaction, so a double tap that
    // interleaved between the SELECT and the INSERT passed both times —
    // double-counting the streak, double-firing indexCompletion and
    // double-charging an AI call. Insert first, let the constraint decide.
    const completion = await this.insertOrConflict(
      () =>
        this.completionRepo.save(
          this.completionRepo.create({ taskId, ...dto }),
        ),
      'Task already completed today',
    );

    // Mark task as completed if it is not repeating
    if (task.repeatFrequency === TaskRepeatFrequency.NONE) {
      task.status = TaskStatus.COMPLETED;
      await this.taskRepo.save(task);
    }

    const result: TaskReactionResult<TaskCompletion> = { data: completion };
    await this.attachReaction(result, user.id, dto.personalityId, {
      safetyText: dto.reflection ?? '',
      event: 'task.completed',
      context: {
        goalName: goal.title,
        streak: '',
        reflection: dto.reflection ?? '',
      },
      userMessage: dto.reflection || 'I completed the task.',
    });

    if (dto.reflection) {
      this.memoryService?.indexCompletion(
        user.id,
        taskId,
        dto.reflection,
        dto.personalityId,
      );
    }

    return result;
  }

  async explain(
    sub: string,
    taskId: string,
    dto: ExplainTaskDto,
  ): Promise<TaskReactionResult<TaskExplanation>> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);

    const user = await this.resolveUser(sub);
    const goal = await this.goalRepo.findOne({ where: { id: task.goalId } });
    if (!goal) throw new NotFoundException(`Goal ${task.goalId} not found`);
    if (goal.userId !== user.id) throw new ForbiddenException();

    // Same as complete(): uq_task_explanations_task_day is the idempotency
    // guarantee, not a preceding SELECT.
    const explanation = await this.insertOrConflict(
      () =>
        this.explanationRepo.save(
          this.explanationRepo.create({ taskId, ...dto }),
        ),
      'Task already explained today',
    );

    // Mark task skipped
    task.status = TaskStatus.SKIPPED;
    await this.taskRepo.save(task);

    const result: TaskReactionResult<TaskExplanation> = { data: explanation };
    await this.attachReaction(result, user.id, dto.personalityId, {
      safetyText: dto.freeText ?? '',
      event: `task.failed.${dto.reason}`,
      context: { reason: dto.reason, freeText: dto.freeText ?? '' },
      userMessage:
        dto.freeText || `I ${dto.reason.replace('_', ' ')} complete the task.`,
    });

    if (dto.freeText) {
      this.memoryService?.indexExplanation(
        user.id,
        taskId,
        dto.freeText,
        dto.personalityId,
      );
    }

    return result;
  }

  /**
   * Materializes the next occurrence of all repeating tasks whose dueDate
   * has passed. Called by a scheduled cron job daily.
   */
  /**
   * Create the next occurrence of every completed, overdue recurring task
   * that does not have one yet.
   *
   * This used to load every completed task in the database, filter it in
   * JavaScript, then issue one findOne per candidate — and since a task stays
   * "completed" forever, every recurring task ever finished was re-checked
   * every night. The cron runs in-process, so that grew into an OOM of the
   * API. Now one keyset-paged query returns only tasks with no next
   * occurrence (NOT EXISTS), served by idx_tasks_recurring_due and
   * idx_tasks_parent_occurrence, and each page is inserted in one statement.
   */
  async materializeRecurringTasks(): Promise<number> {
    let created = 0;
    let afterId = '00000000-0000-0000-0000-000000000000';

    for (;;) {
      const page: Array<{
        id: string;
        goalId: string;
        title: string;
        description: string | null;
        repeatFrequency: TaskRepeatFrequency;
        dueDate: Date;
        occurrenceIndex: number;
      }> = await this.taskRepo.query(
        `
        SELECT p.id, p."goalId", p.title, p.description, p."repeatFrequency",
               p."dueDate", p."occurrenceIndex"
          FROM tasks p
         WHERE p.status = 'completed'
           AND p."repeatFrequency" <> 'none'
           AND p."dueDate" < now()
           AND p.id > $1
           AND NOT EXISTS (
                 SELECT 1 FROM tasks c
                  WHERE c."parentTaskId" = p.id::text
                    AND c."occurrenceIndex" = p."occurrenceIndex" + 1)
         ORDER BY p.id
         LIMIT $2
        `,
        [afterId, RECURRING_PAGE_SIZE],
      );
      if (!page.length) break;

      await this.taskRepo.insert(
        page.map((parent) => ({
          goalId: parent.goalId,
          title: parent.title,
          description: parent.description ?? undefined,
          repeatFrequency: parent.repeatFrequency,
          dueDate: this.nextDueDate(
            new Date(parent.dueDate),
            parent.repeatFrequency,
          ),
          occurrenceIndex: parent.occurrenceIndex + 1,
          parentTaskId: parent.id,
        })),
      );
      created += page.length;

      if (page.length < RECURRING_PAGE_SIZE) break;
      afterId = page[page.length - 1].id;
    }

    return created;
  }

  private async attachReaction<T>(
    result: TaskReactionResult<T>,
    userId: number,
    personalityId: string | undefined,
    opts: {
      safetyText: string;
      event: string;
      context: Record<string, unknown>;
      userMessage: string;
    },
  ): Promise<void> {
    if (!personalityId) return;

    if (this.safetyService.isCrisisSignal(opts.safetyText)) {
      result.mentorReaction = this.safetyService.getCrisisResponse();
      result.safetyFlag = true;
      return;
    }

    if (!this.aiGateway) return;

    try {
      const aiResp = await this.aiGateway.chat({
        userId,
        feature: 'mentor_reaction',
        personalityId,
        event: opts.event,
        context: opts.context,
        messages: [{ role: 'user', content: opts.userMessage }],
        maxTokens: 150,
      });
      result.mentorReaction = aiResp.text;
      // Persist reaction on completions so the board can display it later
      if (result.data instanceof TaskCompletion && aiResp.text) {
        const { affected } = await this.completionRepo.update(
          { id: result.data.id },
          { mentorReaction: aiResp.text },
        );
        // The user already has the reaction in this response; a miss here only
        // means the board will never show it — log rather than fail the call.
        if (!affected) {
          this.logger.warn(
            `Mentor reaction not persisted: completion ${result.data.id} is gone`,
          );
        }
      }
    } catch (err: any) {
      this.logger.warn(`Mentor reaction failed: ${err?.message}`);
    }
  }

  private nextDueDate(from: Date, freq: TaskRepeatFrequency): Date {
    const d = new Date(from);
    switch (freq) {
      case TaskRepeatFrequency.DAILY:
        d.setDate(d.getDate() + 1);
        break;
      case TaskRepeatFrequency.WEEKLY:
        d.setDate(d.getDate() + 7);
        break;
      case TaskRepeatFrequency.MONTHLY:
        d.setMonth(d.getMonth() + 1);
        break;
    }
    return d;
  }

  private async resolveUser(sub: string) {
    const user = await this.usersService.findByAccountSub(sub);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async assertGoalOwnership(
    sub: string,
    goalId: string,
  ): Promise<void> {
    const user = await this.resolveUser(sub);
    const goal = await this.goalRepo.findOne({ where: { id: goalId } });
    if (!goal) throw new NotFoundException(`Goal ${goalId} not found`);
    if (goal.userId !== user.id) throw new ForbiddenException();
  }
}
