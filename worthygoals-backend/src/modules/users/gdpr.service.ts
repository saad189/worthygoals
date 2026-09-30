import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { createObjectStorage, ObjectStorage } from '../media/object-storage';
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
  StatusPost,
  DriftSample,
} from 'src/database/models';
import { Media } from 'src/database/models/media.entity';
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
    @InjectRepository(StatusPost)
    private readonly statusPostRepo: Repository<StatusPost>,
    @InjectRepository(DriftSample)
    private readonly driftSampleRepo: Repository<DriftSample>,
    private readonly cognitoService: AWSCognitoService,
    config: ConfigService,
  ) {
    this.storage = createObjectStorage(config);
  }

  private readonly storage: ObjectStorage | null;

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
      statusPosts,
      driftSamples,
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
      // User-authored text; deletion already reached these by FK cascade,
      // but the export left them out.
      this.statusPostRepo.find({
        where: { userId: user.id },
        relations: { reactions: true },
      }),
      this.driftSampleRepo.find({ where: { userId: user.id } }),
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
      statusPosts,
      driftSamples,
    };
  }

  async deleteAccount(sub: string): Promise<void> {
    const user = await this.findBySub(sub);
    // Read before the rows cascade away — the keys are the only pointer to
    // the uploaded photos.
    const mediaKeys = (
      await this.mediaRepo.find({
        where: { userId: user.id },
        select: { s3Key: true },
      })
    ).map((m) => m.s3Key);

    await this.dataSource.transaction(async (manager) => {
      // Every user-owned table now cascades from users (ECC-1 H5). This used
      // to purge five FK-less tables by hand here, which made erasure depend
      // on every deletion path remembering the same list.
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

    await this.purgeObjects(user.id, mediaKeys);

    this.logger.log(`GDPR account deletion completed for user ${user.id}`);
  }

  /**
   * Delete the user's uploaded photos from S3/R2. Deletion used to drop the
   * media rows and leave the objects in the bucket, unreachable but not
   * erased. Same policy as Cognito: the DB deletion stands; a storage failure
   * is logged loudly for manual follow-up.
   */
  private async purgeObjects(userId: number, keys: string[]): Promise<void> {
    if (!keys.length) return;
    if (!this.storage) {
      this.logger.error(
        `GDPR: ${keys.length} media object(s) for user ${userId} not purged — storage is not configured here. Delete them manually.`,
      );
      return;
    }
    const { s3, bucket } = this.storage;
    try {
      // DeleteObjects takes at most 1000 keys per call.
      for (let i = 0; i < keys.length; i += 1000) {
        const res = await s3.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: {
              Objects: keys.slice(i, i + 1000).map((Key) => ({ Key })),
              Quiet: true,
            },
          }),
        );
        if (res.Errors?.length) {
          throw new Error(
            `${res.Errors.length} key(s) failed, e.g. ${res.Errors[0].Key}: ${res.Errors[0].Message}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `GDPR: DB data deleted but media purge FAILED for user ${userId} — delete drafts/${userId}/ manually. ${(error as Error).message}`,
      );
    }
  }

  private async findBySub(sub: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { account: { sub } },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
