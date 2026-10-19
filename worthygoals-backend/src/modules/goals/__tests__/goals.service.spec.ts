import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  GoalCategory,
  GoalStatus,
  TaskRepeatFrequency,
  TaskStatus,
} from 'src/common/constants';
import { Goal, Task } from 'src/database/models';
import { AiGatewayService } from 'src/core/ai/gateway/ai-gateway.service';
import { GoalsService, toProposal } from '../goals.service';
import { UsersService } from '../../users/users.service';
import { localDay } from 'src/common/timezone';

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
    manager: { transaction: jest.Mock };
  };
  let taskRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
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
      // create() runs inside a transaction; route the manager back to the
      // repo mocks so the assertions below still see each write.
      manager: {
        transaction: jest.fn((cb: (em: unknown) => unknown) =>
          cb({
            create: (entity: unknown, x: unknown) =>
              entity === Goal ? repo.create(x) : taskRepo.create(x),
            save: (x: Record<string, unknown>) =>
              'goalId' in x ? taskRepo.save(x) : repo.save(x),
            find: (_: unknown, opts: unknown) => taskRepo.find(opts),
            remove: (x: unknown) => taskRepo.remove(x),
          }),
        ),
      },
    };
    taskRepo = {
      create: jest.fn((x) => x),
      save: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
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
        { provide: getRepositoryToken(Task), useValue: taskRepo },
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
        expect.objectContaining({ feature: 'goal_propose', quality: 'high' }),
      );
      expect(result.title).toBe('Run a half-marathon');
      expect(result.category).toBe(GoalCategory.POWER);
    });

    it('parses JSON wrapped in markdown fences (Claude does this)', async () => {
      gateway.chat.mockResolvedValue({
        text: '```json\n{"title": "Read 12 books"}\n```',
      });

      const result = await service.propose(USER_SUB, { raw: 'Read more' });

      expect(result.title).toBe('Read 12 books');
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

    it('strips a past or malformed deadline', async () => {
      gateway.chat
        .mockResolvedValueOnce({
          text: JSON.stringify({ title: 'Test', deadline: '2023-10-31' }),
        })
        .mockResolvedValueOnce({
          text: JSON.stringify({ title: 'Test', deadline: 'someday' }),
        });

      expect(
        (await service.propose(USER_SUB, { raw: 'Test' })).deadline,
      ).toBeUndefined();
      expect(
        (await service.propose(USER_SUB, { raw: 'Test' })).deadline,
      ).toBeUndefined();
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

    it('seeds a first task due today from the goal repeatRule', async () => {
      const goal = makeGoal({
        title: 'Run daily',
        repeatRule: { frequency: 'weekly' },
      });
      repo.create.mockReturnValue(goal);
      repo.save.mockResolvedValue(goal);

      await service.create(USER_SUB, { title: 'Run daily' } as any);

      expect(taskRepo.save).toHaveBeenCalledTimes(1);
      const task = taskRepo.create.mock.calls[0][0];
      expect(task).toMatchObject({
        goalId: goal.id,
        title: 'Run daily',
        repeatFrequency: TaskRepeatFrequency.WEEKLY,
      });
      // The user's today (UTC when unset), at their midnight.
      expect(task.dueOn).toBe(localDay('UTC'));
      expect(task.dueDate).toEqual(new Date(`${task.dueOn}T00:00:00Z`));
    });

    // 20:30 UTC Oct 17 is already Oct 18 in Karachi: the first task belongs
    // to the user's today, not the server's.
    it("seeds the first task on the user's local today", async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-10-17T20:30:00Z'));
      usersService.findByAccountSub.mockResolvedValue({
        id: USER_ID,
        timezone: 'Asia/Karachi',
      });
      const goal = makeGoal({ repeatRule: { frequency: 'daily' } });
      repo.create.mockReturnValue(goal);
      repo.save.mockResolvedValue(goal);

      await service.create(USER_SUB, { title: 'Run daily' } as any);
      jest.useRealTimers();

      const task = taskRepo.create.mock.calls[0][0];
      expect(task.dueOn).toBe('2026-10-18');
      expect(task.dueDate).toEqual(new Date('2026-10-17T19:00:00Z'));
    });

    // The app has no way to add a task, so a goal seeded with none was a dead
    // end (every hand-filled wizard goal, Oct 17 simulator QA).
    it('seeds a single one-off task when the goal has no recognisable repeatRule', async () => {
      const goal = makeGoal({ title: 'One-off', repeatRule: undefined });
      repo.create.mockReturnValue(goal);
      repo.save.mockResolvedValue(goal);

      await service.create(USER_SUB, { title: 'One-off' } as any);

      expect(taskRepo.save).toHaveBeenCalledTimes(1);
      expect(taskRepo.create.mock.calls[0][0]).toMatchObject({
        goalId: goal.id,
        title: 'One-off',
        repeatFrequency: TaskRepeatFrequency.NONE,
      });
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
        take: 100,
      });
      expect(result).toHaveLength(2);
    });

    it('rejects a limit outside 1..200', async () => {
      await expect(service.findAllForUser(USER_SUB, '500')).rejects.toThrow(
        'limit must be an integer from 1 to 200',
      );
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

    describe('pause / let it go / resume', () => {
      const TODAY = '2026-10-19';
      const task = (o: Record<string, unknown>) => ({
        goalId: 'goal-uuid-1',
        title: 'Run',
        status: TaskStatus.PENDING,
        repeatFrequency: TaskRepeatFrequency.DAILY,
        ...o,
      });
      const resume = async (from: GoalStatus) => {
        repo.findOne.mockResolvedValue(makeGoal({ status: from }));
        repo.merge.mockImplementation((g, dto) => Object.assign(g, dto));
        repo.save.mockImplementation((g) => g);
        return service.update('goal-uuid-1', USER_SUB, {
          status: GoalStatus.ACTIVE,
        });
      };
      beforeEach(() =>
        jest.useFakeTimers().setSystemTime(new Date(`${TODAY}T09:00:00Z`)),
      );
      afterEach(() => jest.useRealTimers());

      it.each([GoalStatus.PAUSED, GoalStatus.ARCHIVED])(
        'sets %s without touching tasks',
        async (status) => {
          repo.findOne.mockResolvedValue(makeGoal());
          repo.merge.mockImplementation((g, dto) => Object.assign(g, dto));
          repo.save.mockImplementation((g) => g);

          const result = await service.update('goal-uuid-1', USER_SUB, {
            status,
          });

          expect(result.status).toBe(status);
          expect(taskRepo.find).not.toHaveBeenCalled();
        },
      );

      it('brings the newest stranded task to today and drops the older ones', async () => {
        const newest = task({
          id: 'b',
          occurrenceIndex: 5,
          dueOn: '2026-10-10',
        });
        const older = task({
          id: 'a',
          occurrenceIndex: 4,
          dueOn: '2026-10-09',
        });
        taskRepo.find.mockResolvedValue([newest, older]);

        const result = await resume(GoalStatus.PAUSED);

        expect(result.status).toBe(GoalStatus.ACTIVE);
        expect(taskRepo.save).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'b', dueOn: TODAY }),
        );
        expect(taskRepo.remove).toHaveBeenCalledWith([older]);
      });

      it('leaves a goal that already has work today alone, minus stale rows', async () => {
        const stale = task({
          id: 'a',
          occurrenceIndex: 4,
          dueOn: '2026-10-18',
        });
        const todays = task({ id: 'b', occurrenceIndex: 5, dueOn: TODAY });
        taskRepo.find.mockResolvedValue([todays, stale]);

        await resume(GoalStatus.PAUSED);

        expect(taskRepo.save).not.toHaveBeenCalled();
        expect(taskRepo.remove).toHaveBeenCalledWith([stale]);
      });

      it('gives a repeating goal with nothing pending its next occurrence today', async () => {
        taskRepo.find.mockResolvedValue([
          task({
            id: 'done',
            occurrenceIndex: 3,
            status: TaskStatus.COMPLETED,
            dueOn: '2026-10-01',
          }),
        ]);

        await resume(GoalStatus.ARCHIVED);

        expect(taskRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            parentTaskId: 'done',
            occurrenceIndex: 4,
            dueOn: TODAY,
          }),
        );
      });

      it('does not invent work for a finished one-off goal', async () => {
        taskRepo.find.mockResolvedValue([
          task({
            id: 'done',
            status: TaskStatus.COMPLETED,
            repeatFrequency: TaskRepeatFrequency.NONE,
            dueOn: '2026-10-01',
          }),
        ]);

        await resume(GoalStatus.PAUSED);

        expect(taskRepo.save).not.toHaveBeenCalled();
      });
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

describe('toProposal', () => {
  it('replaces a wrong-shaped model reply with the fallback title', () => {
    expect(toProposal({ title: 42 }, 'run a 5k')).toMatchObject({
      title: 'run a 5k',
    });
    expect(toProposal([], 'run a 5k').title).toBe('run a 5k');
    expect(toProposal(null, 'run a 5k').title).toBe('run a 5k');
  });

  it('drops non-string fields and non-object repeat rules', () => {
    const p = toProposal(
      { title: 'Run', costText: 5, repeatRule: ['daily'] },
      'x',
    );
    expect(p.costText).toBeUndefined();
    expect(p.repeatRule).toBeUndefined();
  });

  it('caps text at the CreateGoalDto limits', () => {
    const p = toProposal({ title: 'Run', failureText: 'a'.repeat(5000) }, 'x');
    expect(p.failureText).toHaveLength(1000);
  });
});
