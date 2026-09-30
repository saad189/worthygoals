import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiQuotaUsage } from 'src/database/models/ai-quota-usage.entity';
import { UserTier } from 'src/common/constants/enums';
import { QuotaExceededException, QuotaService } from '../quota/quota.service';

describe('QuotaService', () => {
  let service: QuotaService;
  let repo: { query: jest.Mock };

  // The upsert returns the post-increment count for this call.
  const nthCallToday = (n: number) =>
    repo.query.mockResolvedValue([{ count: n }]);

  beforeEach(async () => {
    repo = { query: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        QuotaService,
        { provide: getRepositoryToken(AiQuotaUsage), useValue: repo },
      ],
    }).compile();
    service = module.get(QuotaService);
  });

  it('allows the 20th free call of the day', async () => {
    nthCallToday(20);
    await expect(
      service.checkAndEnforce(1, UserTier.FREE),
    ).resolves.toBeUndefined();
  });

  it('refuses the 21st free call', async () => {
    nthCallToday(21);
    await expect(
      service.checkAndEnforce(1, UserTier.FREE),
    ).rejects.toBeInstanceOf(QuotaExceededException);
  });

  it('refuses the 101st standard call', async () => {
    nthCallToday(101);
    await expect(
      service.checkAndEnforce(1, UserTier.STANDARD),
    ).rejects.toBeInstanceOf(QuotaExceededException);
  });

  it('never meters premium', async () => {
    await service.checkAndEnforce(1, UserTier.PREMIUM);
    expect(repo.query).not.toHaveBeenCalled();
  });

  it('never meters system calls (negative sentinel user id)', async () => {
    await service.checkAndEnforce(-1, UserTier.FREE);
    expect(repo.query).not.toHaveBeenCalled();
  });

  it('reserves with a single atomic upsert', async () => {
    nthCallToday(1);
    await service.checkAndEnforce(7, UserTier.FREE);
    expect(repo.query).toHaveBeenCalledTimes(1);
    expect(repo.query.mock.calls[0][0]).toContain('ON CONFLICT');
    expect(repo.query.mock.calls[0][1]).toEqual([7]);
  });
});
