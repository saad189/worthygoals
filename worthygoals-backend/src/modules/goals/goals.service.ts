import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal, Task } from 'src/database/models';
import { AiGatewayService } from 'src/core/ai/gateway/ai-gateway.service';
import { GoalCategory, TaskRepeatFrequency } from 'src/common/constants';
import { UsersService } from '../users/users.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { ResponseGoalDto } from './dto/response-goal.dto';
import { ProposeGoalDto } from './dto/propose-goal.dto';
import { GoalProposalDto } from './dto/goal-proposal.dto';

// Prompt is date-aware: without today's date the model grounds relative
// timeframes ("by month end", "in 3 weeks") against its training era and emits
// dates in the past (e.g. 2023-10-31). `today` is passed in at call time.
const buildProposalPrompt = (today: string) =>
  `You are a goal-structuring assistant. Today's date is ${today}. The user gives you a free-form ambition. Return a JSON object with exactly these fields — omit a field only if you genuinely cannot infer it:
- title: string (concise, action-oriented, ≤60 chars)
- description: string (one sentence expanding on the goal)
- costText: string (what the user will have to give up or endure)
- benefitText: string (the concrete reward when achieved)
- failureText: string (what is lost if they quit)
- deadline: ISO 8601 date string (YYYY-MM-DD), always in the future relative to today's date, if a timeframe is implied
- repeatRule: object like {"frequency":"daily"} or {"frequency":"weekly","days":[1,3,6]} if regularity is implied
- category: one of POWER | KNOWLEDGE | SPIRIT | RELATIONSHIPS | FINANCES | HEALTH | CREATIVITY | OTHER

Return ONLY valid JSON — no prose, no markdown fences.`;

@Injectable()
export class GoalsService {
  private readonly logger = new Logger(GoalsService.name);

  constructor(
    @InjectRepository(Goal)
    private readonly goalRepository: Repository<Goal>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly usersService: UsersService,
    private readonly gateway: AiGatewayService,
  ) {}

  async propose(sub: string, dto: ProposeGoalDto): Promise<GoalProposalDto> {
    const user = await this.usersService.findByAccountSub(sub);
    if (!user) throw new NotFoundException('User not found');

    const today = new Date().toISOString().slice(0, 10);
    const response = await this.gateway.chat({
      userId: user.id,
      feature: 'goal_propose',
      model: 'gpt-4o',
      maxTokens: 512,
      temperature: 0.4,
      messages: [
        { role: 'system', content: buildProposalPrompt(today) },
        { role: 'user', content: dto.raw },
      ],
    });

    let parsed: GoalProposalDto;
    try {
      parsed = JSON.parse(response.text) as GoalProposalDto;
    } catch {
      this.logger.warn(
        'Goal proposal JSON parse failed, returning minimal proposal',
      );
      parsed = { title: dto.raw.slice(0, 60) };
    }

    if (
      !Object.values(GoalCategory).includes(parsed.category as GoalCategory)
    ) {
      parsed.category = undefined;
    }

    // Belt-and-braces: never hand back a malformed or past deadline even if the
    // model ignores the grounding instruction.
    if (
      parsed.deadline &&
      (isNaN(Date.parse(parsed.deadline)) || parsed.deadline < today)
    ) {
      parsed.deadline = undefined;
    }

    return parsed;
  }

  async create(sub: string, dto: CreateGoalDto): Promise<ResponseGoalDto> {
    const user = await this.usersService.findByAccountSub(sub);
    if (!user) throw new NotFoundException('User not found');
    const goal = this.goalRepository.create({ ...dto, userId: user.id });
    const saved = await this.goalRepository.save(goal);
    await this.seedFirstTask(saved);
    return this.toDto(saved);
  }

  // ponytail: seed ONE actionable task from the goal's AI-proposed repeatRule so
  // a new goal isn't empty (today screen + goal detail have something to do). The
  // recurring scheduler (materializeRecurringTasks) spins up every occurrence
  // after this first one is completed. Deliberately NOT a full task breakdown:
  // one-off goals (no repeatRule) and multi-step decomposition are left for a
  // future second-AI pass that would break a goal into a concrete task list.
  // See progress-report.html "Goal→task seeding" note for the upgrade path.
  private async seedFirstTask(goal: Goal): Promise<void> {
    const frequency = this.mapRepeatFrequency(goal.repeatRule);
    if (!frequency) return; // no recognisable cadence → no auto-task (yet)

    const dueDate = new Date();
    dueDate.setHours(0, 0, 0, 0); // due today so it lands on the today screen
    await this.taskRepository.save(
      this.taskRepository.create({
        goalId: goal.id,
        title: goal.title,
        description: goal.description,
        repeatFrequency: frequency,
        dueDate,
      }),
    );
  }

  private mapRepeatFrequency(
    repeatRule?: Record<string, unknown>,
  ): TaskRepeatFrequency | null {
    const raw = repeatRule?.frequency;
    if (typeof raw !== 'string') return null;
    const match = raw.toLowerCase();
    // ponytail: only honours frequency; weekly `days:[...]` targeting is a
    // refinement for the advanced version, first task just lands today.
    return (Object.values(TaskRepeatFrequency) as string[]).includes(match) &&
      match !== TaskRepeatFrequency.NONE
      ? (match as TaskRepeatFrequency)
      : null;
  }

  async findAllForUser(sub: string): Promise<ResponseGoalDto[]> {
    const user = await this.usersService.findByAccountSub(sub);
    if (!user) throw new NotFoundException('User not found');
    const goals = await this.goalRepository.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });
    return goals.map((g) => this.toDto(g));
  }

  async findOne(id: string, sub: string): Promise<ResponseGoalDto> {
    const user = await this.usersService.findByAccountSub(sub);
    if (!user) throw new NotFoundException('User not found');
    const goal = await this.goalRepository.findOne({ where: { id } });
    if (!goal) throw new NotFoundException(`Goal ${id} not found`);
    if (goal.userId !== user.id) throw new ForbiddenException();
    return this.toDto(goal);
  }

  async update(
    id: string,
    sub: string,
    dto: UpdateGoalDto,
  ): Promise<ResponseGoalDto> {
    const user = await this.usersService.findByAccountSub(sub);
    if (!user) throw new NotFoundException('User not found');
    const goal = await this.goalRepository.findOne({ where: { id } });
    if (!goal) throw new NotFoundException(`Goal ${id} not found`);
    if (goal.userId !== user.id) throw new ForbiddenException();
    this.goalRepository.merge(goal, dto as unknown as Partial<Goal>);
    const saved = await this.goalRepository.save(goal);
    return this.toDto(saved);
  }

  async remove(id: string, sub: string): Promise<void> {
    const user = await this.usersService.findByAccountSub(sub);
    if (!user) throw new NotFoundException('User not found');
    const goal = await this.goalRepository.findOne({ where: { id } });
    if (!goal) throw new NotFoundException(`Goal ${id} not found`);
    if (goal.userId !== user.id) throw new ForbiddenException();
    await this.goalRepository.remove(goal);
  }

  private toDto(goal: Goal): ResponseGoalDto {
    const {
      id,
      userId,
      mentorId,
      title,
      description,
      category,
      status,
      costText,
      benefitText,
      failureText,
      deadline,
      repeatRule,
      stakeAmount,
      imageUri,
      createdAt,
      updatedAt,
    } = goal;
    return {
      id,
      userId,
      mentorId,
      title,
      description,
      category,
      status,
      costText,
      benefitText,
      failureText,
      deadline,
      repeatRule,
      stakeAmount: stakeAmount ? Number(stakeAmount) : undefined,
      imageUri,
      createdAt,
      updatedAt,
    };
  }
}
