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
import { In, Repository } from 'typeorm';
import {
  Task,
  TaskCompletion,
  TaskExplanation,
  Goal,
} from 'src/database/models';
import {
  ExplanationReason,
  GoalStatus,
  TaskRepeatFrequency,
  TaskStatus,
} from 'src/common/constants';
import { UsersService } from '../users/users.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { ExplainTaskDto } from './dto/explain-task.dto';
import { AiGatewayService } from 'src/core/ai/gateway/ai-gateway.service';
import { SafetyService } from 'src/core/safety/safety.service';
import { MemoryService } from 'src/core/memory/memory.service';
import {
  addDays,
  addMonthsClamped,
  dueOnDay,
  localDay,
} from 'src/common/timezone';

export interface TaskReactionResult<T> {
  data: T;
  mentorReaction?: string;
  safetyFlag?: boolean;
}

/** Postgres unique_violation. */
const UNIQUE_VIOLATION = '23505';

const RECURRING_PAGE_SIZE = 500;

/** What the user said, when they only tapped a reason ("Not today" sheet). */
const MISS_LINE: Record<ExplanationReason, (title: string) => string> = {
  [ExplanationReason.COULDNT]: (t) => `I couldn't do "${t}" today.`,
  [ExplanationReason.FORGOT]: (t) => `I forgot to do "${t}".`,
  [ExplanationReason.CHOSE_NOT_TO]: (t) => `I chose not to do "${t}" today.`,
};

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

    const task = this.taskRepo.create({
      ...dto,
      ...(dto.dueDate
        ? { dueOn: localDay(user.timezone, new Date(dto.dueDate)) }
        : {}),
    });
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
    const user = await this.assertGoalOwnership(sub, task.goalId);
    // dueDate arrives as an ISO string (@IsDateString) for a Date column. The
    // old `as unknown as Partial<Task>` cast hid that and left a string on
    // task.dueDate until the round-trip.
    const { dueDate, ...rest } = dto;
    this.taskRepo.merge(task, {
      ...rest,
      ...(dueDate !== undefined
        ? {
            dueDate: new Date(dueDate),
            dueOn: localDay(user.timezone, new Date(dueDate)),
          }
        : {}),
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

    // Each occurrence of a repeating task is its own row, so it completes like
    // any other; materializeRecurringTasks creates the next one. Leaving
    // repeating tasks pending meant the scheduler never rolled them forward.
    task.status = TaskStatus.COMPLETED;
    await this.taskRepo.save(task);

    const result: TaskReactionResult<TaskCompletion> = { data: completion };
    await this.attachReaction(result, user.id, dto.personalityId, {
      safetyText: dto.reflection ?? '',
      event: 'task.completed',
      context: {
        goalName: goal.title,
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

    // A recurring task's next occurrence rolls forward on its own; a one-off
    // had nothing after it, so its goal was left with no task at all and the
    // sheet's promise ("it comes back tomorrow") wasn't true. One retry per
    // explanation (explanations are unique per task-day); the seriousness
    // check on the 3rd miss is what stops the chain.
    if (
      task.repeatFrequency === TaskRepeatFrequency.NONE &&
      goal.status === GoalStatus.ACTIVE
    ) {
      // "Tomorrow" is the user's tomorrow, not the server's.
      const tomorrow = addDays(localDay(user.timezone), 1);
      await this.taskRepo.save(
        this.taskRepo.create({
          goalId: task.goalId,
          title: task.title,
          description: task.description,
          repeatFrequency: TaskRepeatFrequency.NONE,
          occurrenceIndex: task.occurrenceIndex + 1,
          parentTaskId: task.id,
          ...dueOnDay(tomorrow, user.timezone),
        }),
      );
    }

    const result: TaskReactionResult<TaskExplanation> = { data: explanation };
    await this.attachReaction(result, user.id, dto.personalityId, {
      safetyText: dto.freeText ?? '',
      event: `task.failed.${dto.reason}`,
      context: {
        goalName: goal.title,
        reason: dto.reason,
        freeText: dto.freeText ?? '',
      },
      // With no free text the reason is all the model has to answer, and it
      // used to read "I forgot complete the task." (QA-28).
      userMessage: dto.freeText || MISS_LINE[dto.reason](task.title),
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
   * Create the next occurrence of every overdue recurring task that does not
   * have one yet — whatever its status. A missed (pending) or skipped day
   * still rolls the habit forward; only completing used to.
   *
   * This used to load every completed task in the database, filter it in
   * JavaScript, then issue one findOne per candidate — and since a task stays
   * "completed" forever, every recurring task ever finished was re-checked
   * every night. The cron runs in-process, so that grew into an OOM of the
   * API. Now one keyset-paged query returns only tasks with no next
   * occurrence (NOT EXISTS), served by idx_tasks_recurring_due and
   * idx_tasks_parent_occurrence, and each page is inserted in one statement.
   *
   * Days are the user's: a task rolls forward once its `dueOn` has arrived in
   * the user's own zone, and the next one lands on the next calendar day
   * there. The zone test is done here, not in SQL — `AT TIME ZONE` raises on a
   * name Postgres doesn't know, and one bad row must not stop the job for
   * everyone. SQL only pre-filters to `dueOn <= UTC today + 1` (no zone is
   * further ahead than that). Only active goals roll forward: a paused or
   * let-go goal stops growing tasks.
   */
  async materializeRecurringTasks(now = new Date()): Promise<number> {
    let created = 0;
    let afterId = '00000000-0000-0000-0000-000000000000';

    for (;;) {
      const page: Array<{
        id: string;
        goalId: string;
        title: string;
        description: string | null;
        repeatFrequency: TaskRepeatFrequency;
        dueOn: string;
        occurrenceIndex: number;
        timezone: string;
      }> = await this.taskRepo.query(
        `
        SELECT p.id, p."goalId", p.title, p.description, p."repeatFrequency",
               to_char(p."dueOn", 'YYYY-MM-DD') AS "dueOn",
               p."occurrenceIndex", u.timezone
          FROM tasks p
          JOIN goals g ON g.id = p."goalId"
          JOIN users u ON u.id = g."userId"
         WHERE p."repeatFrequency" <> 'none'
           AND g.status = 'active'
           AND p."dueOn" <= ($3::timestamptz AT TIME ZONE 'UTC')::date + 1
           AND p.id > $1
           AND NOT EXISTS (
                 SELECT 1 FROM tasks c
                  WHERE c."parentTaskId" = p.id::text
                    AND c."occurrenceIndex" = p."occurrenceIndex" + 1)
         ORDER BY p.id
         LIMIT $2
        `,
        [afterId, RECURRING_PAGE_SIZE, now],
      );
      if (!page.length) break;

      const due = page.filter(
        (parent) => parent.dueOn <= localDay(parent.timezone, now),
      );
      if (due.length) {
        await this.taskRepo.insert(
          due.map((parent) => ({
            goalId: parent.goalId,
            title: parent.title,
            description: parent.description ?? undefined,
            repeatFrequency: parent.repeatFrequency,
            ...dueOnDay(
              this.nextDueOn(
                parent.dueOn,
                parent.repeatFrequency,
                localDay(parent.timezone, now),
              ),
              parent.timezone,
            ),
            occurrenceIndex: parent.occurrenceIndex + 1,
            parentTaskId: parent.id,
          })),
        );
        created += due.length;
      }

      if (page.length < RECURRING_PAGE_SIZE) break;
      afterId = page[page.length - 1].id;
    }

    return created;
  }

  /**
   * An unanswered one-off moves to the user's today. A repeating task is
   * superseded by its next occurrence, but a one-off has no next one: once
   * its day passed it simply dropped off the today screen, still pending,
   * with nothing ever asking about it again. Answered ones (completed, or
   * skipped with a reason) are left alone — a skip already scheduled its own
   * retry. Same zone handling as materializeRecurringTasks.
   */
  async carryOverOneOffs(now = new Date()): Promise<number> {
    let moved = 0;
    let afterId = '00000000-0000-0000-0000-000000000000';

    for (;;) {
      const page: Array<{ id: string; dueOn: string; timezone: string }> =
        await this.taskRepo.query(
          `
          SELECT t.id, to_char(t."dueOn", 'YYYY-MM-DD') AS "dueOn", u.timezone
            FROM tasks t
            JOIN goals g ON g.id = t."goalId"
            JOIN users u ON u.id = g."userId"
           WHERE t."repeatFrequency" = 'none'
             AND t.status = 'pending'
             AND g.status = 'active'
             AND t."dueOn" < ($3::timestamptz AT TIME ZONE 'UTC')::date + 1
             AND t.id > $1
           ORDER BY t.id
           LIMIT $2
          `,
          [afterId, RECURRING_PAGE_SIZE, now],
        );
      if (!page.length) break;

      // One UPDATE per (zone, today) group: everyone in a zone shares a day.
      const byTarget = new Map<string, { tz: string; ids: string[] }>();
      for (const row of page) {
        const today = localDay(row.timezone, now);
        if (row.dueOn >= today) continue;
        const key = `${row.timezone}|${today}`;
        const group = byTarget.get(key) ?? { tz: row.timezone, ids: [] };
        group.ids.push(row.id);
        byTarget.set(key, group);
      }
      for (const [key, { tz, ids }] of byTarget) {
        const today = key.split('|')[1];
        await this.taskRepo.update({ id: In(ids) }, dueOnDay(today, tz));
        moved += ids.length;
      }

      if (page.length < RECURRING_PAGE_SIZE) break;
      afterId = page[page.length - 1].id;
    }
    return moved;
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

  // Steps from the parent's dueDate until the result is today or later, so a
  // missed cron run catches up instead of leaving every later occurrence due
  // in the past (and therefore never on the today screen).
  // All in calendar days ("YYYY-MM-DD"), so DST and timezone changes can't
  // drift it. `today` is the user's local day.
  nextDueOn(from: string, freq: TaskRepeatFrequency, today: string): string {
    let d = from;
    let months = 0;
    do {
      switch (freq) {
        case TaskRepeatFrequency.DAILY:
          d = addDays(d, 1);
          break;
        case TaskRepeatFrequency.WEEKLY:
          d = addDays(d, 7);
          break;
        case TaskRepeatFrequency.MONTHLY:
          // From the original day each time: Jan 31 → Feb 28 → Mar 31.
          d = addMonthsClamped(from, ++months);
          break;
        default:
          return d;
      }
    } while (d < today);
    return d;
  }

  private async resolveUser(sub: string) {
    const user = await this.usersService.findByAccountSub(sub);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async assertGoalOwnership(sub: string, goalId: string) {
    const user = await this.resolveUser(sub);
    const goal = await this.goalRepo.findOne({ where: { id: goalId } });
    if (!goal) throw new NotFoundException(`Goal ${goalId} not found`);
    if (goal.userId !== user.id) throw new ForbiddenException();
    return user;
  }
}
