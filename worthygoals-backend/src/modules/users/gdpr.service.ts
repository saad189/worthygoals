import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Account,
  Conversation,
  Goal,
  Message,
  Task,
  TaskCompletion,
  TaskExplanation,
  User,
} from 'src/database/models';

@Injectable()
export class GdprService {
  private readonly logger = new Logger(GdprService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(Goal)
    private readonly goalRepo: Repository<Goal>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(TaskCompletion)
    private readonly completionRepo: Repository<TaskCompletion>,
    @InjectRepository(TaskExplanation)
    private readonly explanationRepo: Repository<TaskExplanation>,
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async exportData(sub: string): Promise<Record<string, unknown>> {
    const user = await this.findBySub(sub);

    const [goals, conversations] = await Promise.all([
      this.goalRepo.find({ where: { userId: user.id } }),
      this.conversationRepo.find({ where: { userId: user.id } }),
    ]);

    const goalIds = goals.map((g) => g.id);
    const convIds = conversations.map((c) => c.id);

    const [tasks, messages] = await Promise.all([
      goalIds.length
        ? this.taskRepo
            .createQueryBuilder('t')
            .where('t.goalId IN (:...ids)', { ids: goalIds })
            .getMany()
        : Promise.resolve([]),
      convIds.length
        ? this.messageRepo
            .createQueryBuilder('m')
            .where('m.conversationId IN (:...ids)', { ids: convIds })
            .getMany()
        : Promise.resolve([]),
    ]);

    const taskIds = tasks.map((t) => t.id);
    const [completions, explanations] = await Promise.all([
      taskIds.length
        ? this.completionRepo
            .createQueryBuilder('c')
            .where('c.taskId IN (:...ids)', { ids: taskIds })
            .getMany()
        : Promise.resolve([]),
      taskIds.length
        ? this.explanationRepo
            .createQueryBuilder('e')
            .where('e.taskId IN (:...ids)', { ids: taskIds })
            .getMany()
        : Promise.resolve([]),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      profile: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        tier: user.tier,
        createdAt: user.dateAdded,
      },
      goals: goals.map((g) => ({
        ...g,
        tasks: tasks
          .filter((t) => t.goalId === g.id)
          .map((t) => ({
            ...t,
            completions: completions.filter((c) => c.taskId === t.id),
            explanations: explanations.filter((e) => e.taskId === t.id),
          })),
      })),
      conversations: conversations.map((c) => ({
        ...c,
        messages: messages.filter((m) => m.conversationId === c.id),
      })),
    };
  }

  async deleteAccount(sub: string): Promise<void> {
    const user = await this.findBySub(sub);
    // Hard delete — cascades to all user-owned data. Account row cascades via
    // the OneToOne relation with onDelete: 'CASCADE' on the Account → User side.
    await this.userRepo.remove(user);
    this.logger.log(`GDPR account deletion completed for user ${user.id}`);
  }

  private async findBySub(sub: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { account: { sub } },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
