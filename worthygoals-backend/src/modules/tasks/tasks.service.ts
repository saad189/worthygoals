import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

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

  async findAllForGoal(sub: string, goalId: string): Promise<Task[]> {
    const user = await this.resolveUser(sub);
    const goal = await this.goalRepo.findOne({ where: { id: goalId } });
    if (!goal) throw new NotFoundException(`Goal ${goalId} not found`);
    if (goal.userId !== user.id) throw new ForbiddenException();

    return this.taskRepo.find({
      where: { goalId },
      order: { dueDate: 'ASC', createdAt: 'ASC' },
    });
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
    this.taskRepo.merge(task, dto as unknown as Partial<Task>);
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

    // Idempotency: one completion per task per calendar day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await this.completionRepo
      .createQueryBuilder('c')
      .where('c.taskId = :taskId', { taskId })
      .andWhere('c.createdAt >= :today', { today })
      .andWhere('c.createdAt < :tomorrow', { tomorrow })
      .getOne();

    if (existing) {
      throw new ConflictException('Task already completed today');
    }

    // Mark task as completed if it is not repeating
    if (task.repeatFrequency === TaskRepeatFrequency.NONE) {
      task.status = TaskStatus.COMPLETED;
      await this.taskRepo.save(task);
    }

    const completion = await this.completionRepo.save(
      this.completionRepo.create({ taskId, ...dto }),
    );

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

    // Idempotency: one explanation per task per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await this.explanationRepo
      .createQueryBuilder('e')
      .where('e.taskId = :taskId', { taskId })
      .andWhere('e.createdAt >= :today', { today })
      .andWhere('e.createdAt < :tomorrow', { tomorrow })
      .getOne();

    if (existing) {
      throw new ConflictException('Task already explained today');
    }

    // Mark task skipped
    task.status = TaskStatus.SKIPPED;
    await this.taskRepo.save(task);

    const explanation = await this.explanationRepo.save(
      this.explanationRepo.create({ taskId, ...dto }),
    );

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
  async materializeRecurringTasks(): Promise<number> {
    const now = new Date();
    const repeatingTasks = await this.taskRepo.find({
      where: { status: TaskStatus.COMPLETED },
    });

    const candidates = repeatingTasks.filter(
      (t) =>
        t.repeatFrequency !== TaskRepeatFrequency.NONE &&
        t.dueDate &&
        t.dueDate < now,
    );

    let created = 0;
    for (const parent of candidates) {
      const nextDue = this.nextDueDate(parent.dueDate, parent.repeatFrequency);

      // Skip if a future occurrence already exists
      const exists = await this.taskRepo.findOne({
        where: {
          parentTaskId: parent.id,
          occurrenceIndex: parent.occurrenceIndex + 1,
        },
      });
      if (exists) continue;

      await this.taskRepo.save(
        this.taskRepo.create({
          goalId: parent.goalId,
          title: parent.title,
          description: parent.description,
          repeatFrequency: parent.repeatFrequency,
          dueDate: nextDue,
          occurrenceIndex: parent.occurrenceIndex + 1,
          parentTaskId: parent.id,
        }),
      );
      created++;
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
        await this.completionRepo.update(
          { id: (result.data as TaskCompletion).id },
          { mentorReaction: aiResp.text },
        );
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
