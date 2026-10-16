import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiQuotaUsage } from 'src/database/models/ai-quota-usage.entity';
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
    @InjectRepository(AiQuotaUsage)
    private readonly usageRepo: Repository<AiQuotaUsage>,
  ) {}

  /**
   * Reserve one call against today's quota, or throw.
   *
   * One INSERT … ON CONFLICT DO UPDATE … RETURNING is atomic, so parallel
   * requests each get a distinct count and the 21st free call is refused even
   * when all 21 arrive together. A refused call still increments the counter;
   * that only changes the number a later refusal reports.
   *
   * System calls (memory digests pass a negative sentinel id) are not user
   * spend and are not metered — they used to share one free-tier bucket of 20,
   * so digests silently stopped after the twentieth user.
   */
  async checkAndEnforce(userId: number, tier: UserTier): Promise<void> {
    const limit = DAILY_LIMITS[tier];
    if (!isFinite(limit) || userId <= 0) return;

    const [{ count }]: Array<{ count: number }> = await this.usageRepo.query(
      `
      INSERT INTO ai_quota_usage ("userId", day, count)
      VALUES ($1, (now() AT TIME ZONE 'UTC')::date, 1)
      ON CONFLICT ("userId", day)
      DO UPDATE SET count = ai_quota_usage.count + 1
      RETURNING count
      `,
      [userId],
    );

    if (count > limit) {
      this.logger.warn(`User ${userId} over daily AI quota (${tier})`);
      throw new QuotaExceededException(userId, tier, count - 1, limit);
    }
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
