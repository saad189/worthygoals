import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from 'src/database/models';
import { UsersService } from '../users/users.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { ResponseGoalDto } from './dto/response-goal.dto';

@Injectable()
export class GoalsService {
  private readonly logger = new Logger(GoalsService.name);

  constructor(
    @InjectRepository(Goal)
    private readonly goalRepository: Repository<Goal>,
    private readonly usersService: UsersService,
  ) {}

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
