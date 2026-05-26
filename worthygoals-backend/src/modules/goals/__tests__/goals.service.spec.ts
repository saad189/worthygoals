import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GoalCategory, GoalStatus } from 'src/common/constants';
import { Goal } from 'src/database/models';
import { AiGatewayService } from 'src/core/ai/gateway/ai-gateway.service';
import { GoalsService } from '../goals.service';
import { UsersService } from '../../users/users.service';

const USER_ID = 1;
const USER_SUB = 'cognito-sub-abc';

const makeGoal = (overrides: Partial<Goal> = {}): Goal =>
  ({
    id: 'goal-uuid-1',
    userId: USER_ID,
    mentorId: undefined,
    title: 'Test Goal',
    description: undefined,
    category: GoalCategory.POWER,
    status: GoalStatus.ACTIVE,
    costText: undefined,
    benefitText: undefined,
    failureText: undefined,
    deadline: undefined,
    repeatRule: undefined,
    stakeAmount: undefined,
    imageUri: undefined,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as Goal;

describe('GoalsService', () => {
  let service: GoalsService;
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    merge: jest.Mock;
    remove: jest.Mock;
  };
  let usersService: { findByAccountSub: jest.Mock };
  let gateway: { chat: jest.Mock };

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      merge: jest.fn(),
      remove: jest.fn(),
    };
    usersService = {
      findByAccountSub: jest.fn().mockResolvedValue({ id: USER_ID }),
    };
    gateway = { chat: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        { provide: getRepositoryToken(Goal), useValue: repo },
        { provide: UsersService, useValue: usersService },
        { provide: AiGatewayService, useValue: gateway },
      ],
    }).compile();

    service = module.get<GoalsService>(GoalsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('propose', () => {
    it('calls gateway and returns parsed proposal', async () => {
      const proposal = {
        title: 'Run a half-marathon',
        costText: 'Hours of training',
        benefitText: 'Improved fitness',
        failureText: 'Missed race window',
        deadline: '2026-10-01',
        repeatRule: { frequency: 'weekly' },
        category: GoalCategory.POWER,
      };
      gateway.chat.mockResolvedValue({ text: JSON.stringify(proposal) });

      const result = await service.propose(USER_SUB, {
        raw: 'I want to run a half-marathon by October',
      });

      expect(gateway.chat).toHaveBeenCalledWith(
        expect.objectContaining({ feature: 'goal_propose', model: 'gpt-4o' }),
      );
      expect(result.title).toBe('Run a half-marathon');
      expect(result.category).toBe(GoalCategory.POWER);
    });

    it('falls back to raw text as title when JSON is malformed', async () => {
      gateway.chat.mockResolvedValue({ text: 'not valid json' });

      const result = await service.propose(USER_SUB, { raw: 'Run more' });

      expect(result.title).toBe('Run more');
    });

    it('strips invalid category values', async () => {
      gateway.chat.mockResolvedValue({
        text: JSON.stringify({ title: 'Test', category: 'INVALID' }),
      });

      const result = await service.propose(USER_SUB, { raw: 'Test' });

      expect(result.category).toBeUndefined();
    });

    it('throws NotFoundException when user not found', async () => {
      usersService.findByAccountSub.mockResolvedValue(null);
      await expect(service.propose(USER_SUB, { raw: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('resolves sub and creates a goal', async () => {
      const dto = { title: 'Run daily', category: GoalCategory.POWER };
      const goal = makeGoal({ title: 'Run daily' });
      repo.create.mockReturnValue(goal);
      repo.save.mockResolvedValue(goal);

      const result = await service.create(USER_SUB, dto as any);

      expect(usersService.findByAccountSub).toHaveBeenCalledWith(USER_SUB);
      expect(repo.create).toHaveBeenCalledWith({ ...dto, userId: USER_ID });
      expect(result.title).toBe('Run daily');
    });

    it('throws NotFoundException when user not found', async () => {
      usersService.findByAccountSub.mockResolvedValue(null);
      await expect(
        service.create(USER_SUB, { title: 'x' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllForUser', () => {
    it('returns goals for the resolved user', async () => {
      repo.find.mockResolvedValue([makeGoal(), makeGoal({ id: 'b' })]);

      const result = await service.findAllForUser(USER_SUB);

      expect(repo.find).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('returns goal when owned by user', async () => {
      repo.findOne.mockResolvedValue(makeGoal());
      const result = await service.findOne('goal-uuid-1', USER_SUB);
      expect(result.id).toBe('goal-uuid-1');
    });

    it('throws NotFoundException when goal not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing', USER_SUB)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when user does not own goal', async () => {
      repo.findOne.mockResolvedValue(makeGoal({ userId: 99 }));
      await expect(service.findOne('goal-uuid-1', USER_SUB)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('merges and saves updated goal', async () => {
      const goal = makeGoal();
      const updated = makeGoal({ title: 'Updated' });
      repo.findOne.mockResolvedValue(goal);
      repo.merge.mockImplementation((g, dto) => Object.assign(g, dto));
      repo.save.mockResolvedValue(updated);

      const result = await service.update('goal-uuid-1', USER_SUB, {
        title: 'Updated',
      });
      expect(result.title).toBe('Updated');
    });

    it('throws ForbiddenException when user does not own goal', async () => {
      repo.findOne.mockResolvedValue(makeGoal({ userId: 99 }));
      await expect(
        service.update('goal-uuid-1', USER_SUB, { title: 'X' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('removes goal owned by user', async () => {
      const goal = makeGoal();
      repo.findOne.mockResolvedValue(goal);
      repo.remove.mockResolvedValue(undefined);

      await expect(
        service.remove('goal-uuid-1', USER_SUB),
      ).resolves.toBeUndefined();
      expect(repo.remove).toHaveBeenCalledWith(goal);
    });

    it('throws ForbiddenException when user does not own goal', async () => {
      repo.findOne.mockResolvedValue(makeGoal({ userId: 99 }));
      await expect(service.remove('goal-uuid-1', USER_SUB)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
