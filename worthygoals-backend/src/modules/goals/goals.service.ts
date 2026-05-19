import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from 'src/database/models';
import { AiGatewayService } from 'src/core/ai/gateway/ai-gateway.service';
import { GoalCategory } from 'src/common/constants';
import { UsersService } from '../users/users.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { ResponseGoalDto } from './dto/response-goal.dto';
import { ProposeGoalDto } from './dto/propose-goal.dto';
import { GoalProposalDto } from './dto/goal-proposal.dto';

const PROPOSAL_SYSTEM_PROMPT = `You are a goal-structuring assistant. The user gives you a free-form ambition. Return a JSON object with exactly these fields — omit a field only if you genuinely cannot infer it:
- title: string (concise, action-oriented, ≤60 chars)
- description: string (one sentence expanding on the goal)
- costText: string (what the user will have to give up or endure)
- benefitText: string (the concrete reward when achieved)
- failureText: string (what is lost if they quit)
- deadline: ISO 8601 date string (YYYY-MM-DD) if a timeframe is implied
- repeatRule: object like {"frequency":"daily"} or {"frequency":"weekly","days":[1,3,6]} if regularity is implied
- category: one of POWER | KNOWLEDGE | SPIRIT | RELATIONSHIPS | FINANCES | HEALTH | CREATIVITY | OTHER

Return ONLY valid JSON — no prose, no markdown fences.`;

@Injectable()
export class GoalsService {
  private readonly logger = new Logger(GoalsService.name);

  constructor(
    @InjectRepository(Goal)
    private readonly goalRepository: Repository<Goal>,
    private readonly usersService: UsersService,
    private readonly gateway: AiGatewayService,
  ) {}

  async propose(sub: string, dto: ProposeGoalDto): Promise<GoalProposalDto> {
    const user = await this.usersService.findByAccountSub(sub);
    if (!user) throw new NotFoundException('User not found');

    const response = await this.gateway.chat({
      userId: user.id,
      feature: 'goal_propose',
      model: 'gpt-4o',
      maxTokens: 512,
      temperature: 0.4,
      messages: [
        { role: 'system', content: PROPOSAL_SYSTEM_PROMPT },
        { role: 'user', content: dto.raw },
      ],
    });

    let parsed: GoalProposalDto;
    try {
      parsed = JSON.parse(response.text) as GoalProposalDto;
    } catch {
      this.logger.warn('Goal proposal JSON parse failed, returning minimal proposal');
      parsed = { title: dto.raw.slice(0, 60) };
    }

    if (!Object.values(GoalCategory).includes(parsed.category as GoalCategory)) {
      parsed.category = undefined;
    }

    return parsed;
  }

  async create(sub: string, dto: CreateGoalDto): Promise<ResponseGoalDto> {
    const user = await this.usersService.findByAccountSub(sub);
    if (!user) throw new NotFoundException('User not found');
    const goal = this.goalRepository.create({ ...dto, userId: user.id });
    const saved = await this.goalRepository.save(goal);
    return this.toDto(saved);
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
