import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiCall } from 'src/database/models/ai-call.entity';
import { UserTier } from 'src/common/constants/enums';
import { QuotaExceededException, QuotaService } from '../quota/quota.service';

const mockRepo = () => ({ count: jest.fn() });

describe('QuotaService', () => {
  let service: QuotaService;
  let repo: jest.Mocked<Pick<Repository<AiCall>, 'count'>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        QuotaService,
        { provide: getRepositoryToken(AiCall), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get(QuotaService);
    repo = module.get(getRepositoryToken(AiCall));
  });

  it('allows call when under limit', async () => {
    repo.count = jest.fn().mockResolvedValue(5);
    await expect(
      service.checkAndEnforce(1, UserTier.FREE),
    ).resolves.toBeUndefined();
  });

  it('throws QuotaExceededException at limit', async () => {
    repo.count = jest.fn().mockResolvedValue(20);
    await expect(
      service.checkAndEnforce(1, UserTier.FREE),
    ).rejects.toBeInstanceOf(QuotaExceededException);
  });

  it('throws at standard limit (100)', async () => {
    repo.count = jest.fn().mockResolvedValue(100);
    await expect(
      service.checkAndEnforce(1, UserTier.STANDARD),
    ).rejects.toBeInstanceOf(QuotaExceededException);
  });

  it('never throws for premium regardless of count', async () => {
    repo.count = jest.fn().mockResolvedValue(9999);
    await expect(
      service.checkAndEnforce(1, UserTier.PREMIUM),
    ).resolves.toBeUndefined();
    expect(repo.count).not.toHaveBeenCalled();
  });

  it('returns today usage', async () => {
    repo.count = jest.fn().mockResolvedValue(7);
    const usage = await service.getUsage(1);
    expect(usage.today).toBe(7);
  });
});
