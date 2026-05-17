import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Goal, Task, TaskCompletion } from 'src/database/models';
import { DashboardService } from '../dashboard.service';
import { UsersService } from '../../users/users.service';

const USER_ID = 1;
const USER_SUB = 'cognito-sub-abc';

describe('DashboardService', () => {
  let service: DashboardService;
  let goalRepo: { find: jest.Mock };
  let taskRepo: { createQueryBuilder: jest.Mock };
  let completionRepo: { createQueryBuilder: jest.Mock };
  let usersService: { findByAccountSub: jest.Mock };

  const makeQb = (results: unknown[]) => ({
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(results),
    getRawMany: jest.fn().mockResolvedValue(results),
  });

  beforeEach(async () => {
    goalRepo = { find: jest.fn() };
    taskRepo = { createQueryBuilder: jest.fn().mockReturnValue(makeQb([])) };
    completionRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(makeQb([])),
    };
    usersService = {
      findByAccountSub: jest.fn().mockResolvedValue({ id: USER_ID }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(Goal), useValue: goalRepo },
        { provide: getRepositoryToken(Task), useValue: taskRepo },
        {
          provide: getRepositoryToken(TaskCompletion),
          useValue: completionRepo,
        },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('throws NotFoundException when user not found', async () => {
    usersService.findByAccountSub.mockResolvedValue(null);
    goalRepo.find = jest.fn().mockResolvedValue([]);
    await expect(service.getDashboard(USER_SUB)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns empty dashboard when user has no goals', async () => {
    goalRepo.find = jest.fn().mockResolvedValue([]);
    const result = await service.getDashboard(USER_SUB);
    expect(result.goals).toHaveLength(0);
    expect(result.todayProgress).toEqual({ completed: 0, total: 0 });
    expect(result.weekCompletions).toHaveLength(7);
  });

  describe('computeStreak', () => {
    it('returns 0,0 for empty dates', () => {
      expect(service.computeStreak([])).toEqual({ current: 0, longest: 0 });
    });

    it('returns current=1, longest=1 for a single completion today', () => {
      const result = service.computeStreak([new Date()]);
      expect(result.current).toBe(1);
      expect(result.longest).toBe(1);
    });

    it('computes longest streak correctly across a gap', () => {
      const dates = [
        new Date('2026-01-01'),
        new Date('2026-01-02'),
        new Date('2026-01-03'),
        new Date('2026-01-05'), // gap
        new Date('2026-01-06'),
      ];
      const { longest } = service.computeStreak(dates);
      expect(longest).toBe(3);
    });

    it('deduplicates same-day completions before counting', () => {
      const dates = [
        new Date('2026-01-01T09:00:00'),
        new Date('2026-01-01T18:00:00'), // same day
        new Date('2026-01-02'),
      ];
      const { longest } = service.computeStreak(dates);
      expect(longest).toBe(2);
    });

    it('current streak is 0 if last completion was 2+ days ago', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000);
      const { current } = service.computeStreak([twoDaysAgo]);
      expect(current).toBe(0);
    });

    it('current streak counts from yesterday when today has no completion', () => {
      const yesterday = new Date(Date.now() - 86_400_000);
      yesterday.setHours(12, 0, 0, 0);
      const dayBefore = new Date(Date.now() - 2 * 86_400_000);
      dayBefore.setHours(12, 0, 0, 0);
      const { current } = service.computeStreak([yesterday, dayBefore]);
      expect(current).toBe(2);
    });
  });
});
