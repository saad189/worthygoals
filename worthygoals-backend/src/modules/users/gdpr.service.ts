import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Account,
  AiCall,
  Conversation,
  Goal,
  MemoryDigest,
  MemoryEmbedding,
  Message,
  NotificationLog,
  PushToken,
  Task,
  TaskCompletion,
  TaskExplanation,
  User,
  UserPersonality,
} from 'src/database/models';
import { Media } from '../media/media.entity';
import { AWSCognitoService } from '../auth/aws-cognito.service';

@Injectable()
export class GdprService {
  private readonly logger = new Logger(GdprService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
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
    @InjectRepository(UserPersonality)
    private readonly userPersonalityRepo: Repository<UserPersonality>,
    @InjectRepository(MemoryDigest)
    private readonly memoryDigestRepo: Repository<MemoryDigest>,
    @InjectRepository(MemoryEmbedding)
    private readonly memoryEmbeddingRepo: Repository<MemoryEmbedding>,
    @InjectRepository(PushToken)
    private readonly pushTokenRepo: Repository<PushToken>,
    @InjectRepository(NotificationLog)
    private readonly notificationLogRepo: Repository<NotificationLog>,
    @InjectRepository(AiCall)
    private readonly aiCallRepo: Repository<AiCall>,
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
    private readonly cognitoService: AWSCognitoService,
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

    const [
      personalities,
      memoryDigests,
      memoryEmbeddings,
      pushTokens,
      notificationLogs,
      aiCalls,
      media,
    ] = await Promise.all([
      this.userPersonalityRepo.find({ where: { userId: user.id } }),
      this.memoryDigestRepo.find({ where: { userId: user.id } }),
      this.memoryEmbeddingRepo
        .createQueryBuilder('me')
        .select([
          'me.id',
          'me.sourceType',
          'me.sourceId',
          'me.embeddingText',
          'me.personalityId',
          'me.createdAt',
        ])
        .where('me.userId = :userId', { userId: user.id })
        .getMany(),
      this.pushTokenRepo.find({ where: { userId: user.id } }),
      this.notificationLogRepo.find({ where: { userId: user.id } }),
      this.aiCallRepo.find({ where: { userId: user.id } }),
      this.mediaRepo.find({ where: { userId: user.id } }),
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
      personalities,
      memoryDigests,
      memorySnippets: memoryEmbeddings,
      pushTokens,
      notificationLogs,
      aiCalls,
      media,
    };
  }

  async deleteAccount(sub: string): Promise<void> {
    const user = await this.findBySub(sub);

    await this.dataSource.transaction(async (manager) => {
      // These tables carry a userId but no FK to users, so the
      // users-row cascade never reaches them — purge explicitly.
      await manager.delete(MemoryEmbedding, { userId: user.id });
      await manager.delete(MemoryDigest, { userId: user.id });
      await manager.delete(PushToken, { userId: user.id });
      await manager.delete(NotificationLog, { userId: user.id });
      await manager.delete(AiCall, { userId: user.id });

      // The FK cascade runs accounts → users → owned data, so the account
      // row must be the deletion root; removing only the user would leave
      // the accounts row (email + sub) behind.
      if (user.account) {
        await manager.remove(user.account);
      } else {
        await manager.remove(user);
      }
    });

    // The Cognito identity is personal data too. DB deletion already
    // succeeded, so a Cognito failure must not roll it back — log loudly
    // for manual follow-up instead.
    try {
      await this.cognitoService.remove(sub);
    } catch (error) {
      this.logger.error(
        `GDPR: DB data deleted but Cognito account removal FAILED for sub ${sub} — delete it manually. ${error.message}`,
      );
    }

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
