import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Goal, Task, TaskCompletion } from 'src/database/models';
import { BoardService } from '../board.service';
import { UsersService } from '../../users/users.service';
import { MediaService } from '../../media/media.service';

/** ECC-1 H4: milestones come from SQL day rows, not hydrated task graphs. */
describe('BoardService milestones', () => {
  let service: BoardService;
  const goalRepo = {
    find: jest.fn(),
    manager: { query: jest.fn() },
  };
  const winQb = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
  };

  const ymd = (offset: number) => {
    const d = new Date();
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        BoardService,
        { provide: getRepositoryToken(Goal), useValue: goalRepo },
        { provide: getRepositoryToken(Task), useValue: {} },
        {
          provide: getRepositoryToken(TaskCompletion),
          useValue: { createQueryBuilder: () => winQb },
        },
        {
          provide: UsersService,
          useValue: {
            findByAccountSub: jest.fn().mockResolvedValue({ id: 1 }),
          },
        },
        { provide: MediaService, useValue: { getPresignedGetUrl: jest.fn() } },
      ],
    }).compile();
    service = module.get(BoardService);
  });

  it('awards a 7-day streak milestone from distinct completion days', async () => {
    goalRepo.find.mockResolvedValue([
      {
        id: 'g1',
        title: 'Run',
        category: 'power',
        status: 'active',
        updatedAt: new Date(),
      },
    ]);
    goalRepo.manager.query.mockResolvedValue(
      Array.from({ length: 7 }, (_, i) => ({ goalId: 'g1', day: ymd(i) })),
    );

    const items = await service.getBoard('sub');

    expect(goalRepo.find.mock.calls[0][0].relations).toBeUndefined();
    expect(items).toEqual([
      expect.objectContaining({ milestoneKind: 'streak_7', streakDays: 7 }),
    ]);
  });

  it('still reports a completed goal with no completions', async () => {
    goalRepo.find.mockResolvedValue([
      {
        id: 'g2',
        title: 'Ship',
        category: 'power',
        status: 'completed',
        updatedAt: new Date(),
      },
    ]);
    goalRepo.manager.query.mockResolvedValue([]);

    const items = await service.getBoard('sub');

    expect(items).toEqual([
      expect.objectContaining({ milestoneKind: 'goal_completed' }),
    ]);
  });
});
