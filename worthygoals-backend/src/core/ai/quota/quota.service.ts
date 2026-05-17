import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { AiCall } from 'src/database/models/ai-call.entity';
import { UserTier } from 'src/common/constants/enums';

const DAILY_LIMITS: Record<UserTier, number> = {
  [UserTier.FREE]: 20,
  [UserTier.STANDARD]: 100,
  [UserTier.PREMIUM]: Infinity,
};

@Injectable()
export class QuotaService {
  private readonly logger = new Logger(QuotaService.name);

  constructor(
    @InjectRepository(AiCall)
    private readonly aiCallRepo: Repository<AiCall>,
  ) {}

  async checkAndEnforce(userId: number, tier: UserTier): Promise<void> {
    const limit = DAILY_LIMITS[tier];
    if (!isFinite(limit)) return;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const count = await this.aiCallRepo.count({
      where: { userId, createdAt: MoreThanOrEqual(startOfDay) },
    });

    if (count >= limit) {
      throw new QuotaExceededException(userId, tier, count, limit);
    }
  }

  async getUsage(userId: number): Promise<{ today: number }> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const count = await this.aiCallRepo.count({
      where: { userId, createdAt: MoreThanOrEqual(startOfDay) },
    });
    return { today: count };
  }
}

export class QuotaExceededException extends Error {
  readonly statusCode = 402;
  readonly code = 'quota_exceeded';

  constructor(
    readonly userId: number,
    readonly tier: UserTier,
    readonly current: number,
    readonly limit: number,
  ) {
    super(
      `Daily AI quota exceeded for user ${userId} (${tier}): ${current}/${limit}`,
    );
  }
}
