import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Goal } from 'src/database/models';
import { AiGatewayService } from 'src/core/ai/gateway/ai-gateway.service';
import { WeeklyReviewService } from '../weekly-review.service';
import { UsersService } from '../../users/users.service';

const USER_ID = 1;
const USER_SUB = 'cognito-sub-abc';

const DAY = 86_400_000;

/** A completion timestamp `daysAgo` before now. */
function completionAt(daysAgo: number) {
  return { createdAt: new Date(Date.now() - daysAgo * DAY) };
}

/** Build a goal whose single task carries the given completion timestamps. */
function goal(
  id: string,
  title: string,
  completions: { createdAt: Date }[],
  mentor?: { personalityId: string | null; name: string },
): Partial<Goal> {
  return {
    id,
    title,
    mentor: mentor as any,
    tasks: [{ completions } as any],
  };
}

describe('WeeklyReviewService', () => {
  let service: WeeklyReviewService;
  let goalRepo: { find: jest.Mock };
  let usersService: { findByAccountSub: jest.Mock };
  let gateway: { chat: jest.Mock };

  beforeEach(async () => {
    goalRepo = { find: jest.fn().mockResolvedValue([]) };
    usersService = {
      findByAccountSub: jest.fn().mockResolvedValue({ id: USER_ID }),
    };
    gateway = {
      chat: jest.fn(async (req) => ({
        text: `commentary from ${req.personalityId}`,
        model: 'gpt-4o-mini',
        provider: 'openai',
        tokensIn: 1,
        tokensOut: 1,
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeeklyReviewService,
        { provide: getRepositoryToken(Goal), useValue: goalRepo },
        { provide: UsersService, useValue: usersService },
        { provide: AiGatewayService, useValue: gateway },
      ],
    }).compile();

    service = module.get<WeeklyReviewService>(WeeklyReviewService);
  });

  it('throws NotFoundException when the user is not found', async () => {
    usersService.findByAccountSub.mockResolvedValue(null);
    await expect(service.getReview(USER_SUB)).rejects.toThrow(NotFoundException);
  });

  it('counts this-week vs last-week completions and marks the trend up', async () => {
    // today is always within this week; today−7d is always within last week.
    goalRepo.find.mockResolvedValue([
      goal('g1', '5k run', [completionAt(0), completionAt(0), completionAt(7)], {
        personalityId: 'marcus',
        name: 'Marcus',
      }),
    ]);

    const review = await service.getReview(USER_SUB);
    const row = review.goals[0];

    expect(row.thisWeekCount).toBe(2);
    expect(row.lastWeekCount).toBe(1);
    expect(row.delta).toBe(1);
    expect(row.trend).toBe('up');
    expect(row.danger).toBe(false);
    expect(review.onTrackCount).toBe(1);
    expect(review.totalGoals).toBe(1);
  });

  it('flags a goal with no completions this week as danger / down', async () => {
    goalRepo.find.mockResolvedValue([
      goal('g2', 'sleep by 11', [completionAt(7)], {
        personalityId: 'lyra',
        name: 'Lyra',
      }),
    ]);

    const review = await service.getReview(USER_SUB);
    const row = review.goals[0];

    expect(row.thisWeekCount).toBe(0);
    expect(row.lastWeekCount).toBe(1);
    expect(row.trend).toBe('down');
    expect(row.danger).toBe(true);
    expect(review.onTrackCount).toBe(0);
  });

  it("resolves the goal's mentor and falls back to marcus when none is set", async () => {
    goalRepo.find.mockResolvedValue([
      goal('g3', 'lift', [completionAt(0)], { personalityId: 'goggs', name: 'Goggs' }),
      goal('g4', 'read', [completionAt(0)], undefined),
    ]);

    const review = await service.getReview(USER_SUB);

    expect(review.goals[0].mentorPersonalityId).toBe('goggs');
    expect(review.goals[1].mentorPersonalityId).toBe('marcus');
    expect(review.goals[1].mentorName).toBe('Marcus');
    // One in-voice commentary call per goal, tagged weekly.review.
    expect(gateway.chat).toHaveBeenCalledTimes(2);
    expect(gateway.chat.mock.calls[0][0].event).toBe('weekly.review');
  });

  it('falls back to a template line when the AI call fails', async () => {
    gateway.chat.mockRejectedValue(new Error('model down'));
    goalRepo.find.mockResolvedValue([
      goal('g5', 'cold shower', [completionAt(0)], {
        personalityId: 'goggs',
        name: 'Goggs',
      }),
    ]);

    const review = await service.getReview(USER_SUB);
    expect(review.goals[0].commentary.length).toBeGreaterThan(0);
    expect(review.goals[0].commentary).not.toContain('commentary from');
  });
});
