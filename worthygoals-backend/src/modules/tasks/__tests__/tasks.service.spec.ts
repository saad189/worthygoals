import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ExplanationReason,
  GoalStatus,
  TaskRepeatFrequency,
  TaskStatus,
} from 'src/common/constants';
import {
  Goal,
  Task,
  TaskCompletion,
  TaskExplanation,
} from 'src/database/models';
import { UsersService } from '../../users/users.service';
import { AiGatewayService } from 'src/core/ai/gateway/ai-gateway.service';
import { SafetyService } from 'src/core/safety/safety.service';
import { TasksService } from '../tasks.service';
import { addDays, localDay } from 'src/common/timezone';

const USER_ID = 1;
const GOAL_ID = '11111111-1111-4111-8111-111111111111';
const TASK_ID = '22222222-2222-4222-8222-222222222222';
const SUB = 'cognito-sub';

const makeGoal = (o: Partial<Goal> = {}) =>
  ({
    id: GOAL_ID,
    userId: USER_ID,
    title: 'My Goal',
    status: GoalStatus.ACTIVE,
    ...o,
  }) as Goal;

const makeTask = (o: Partial<Task> = {}) =>
  ({
    id: TASK_ID,
    goalId: GOAL_ID,
    title: 'Run',
    status: TaskStatus.PENDING,
    repeatFrequency: TaskRepeatFrequency.NONE,
    occurrenceIndex: 0,
    ...o,
  }) as Task;

const makeCompletion = (o: Partial<TaskCompletion> = {}) =>
  ({ id: 'comp-uuid', taskId: TASK_ID, moodScore: 3, ...o }) as TaskCompletion;

const makeExplanation = (o: Partial<TaskExplanation> = {}) =>
  ({
    id: 'expl-uuid',
    taskId: TASK_ID,
    reason: ExplanationReason.FORGOT,
    ...o,
  }) as TaskExplanation;

describe('TasksService', () => {
  let service: TasksService;
  let taskRepo: Record<string, jest.Mock>;
  let completionRepo: Record<string, jest.Mock>;
  let explanationRepo: Record<string, jest.Mock>;
  let goalRepo: Record<string, jest.Mock>;
  let usersService: { findByAccountSub: jest.Mock };
  let aiGateway: { chat: jest.Mock };
  let safetyService: {
    isCrisisSignal: jest.Mock;
    getCrisisResponse: jest.Mock;
  };

  beforeEach(async () => {
    const qbMock = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };
    taskRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      merge: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(qbMock),
      query: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
    };
    completionRepo = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        ...qbMock,
        getOne: jest.fn().mockResolvedValue(null),
      }),
    };
    explanationRepo = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        ...qbMock,
        getOne: jest.fn().mockResolvedValue(null),
      }),
    };
    goalRepo = { findOne: jest.fn() };
    usersService = {
      findByAccountSub: jest.fn().mockResolvedValue({ id: USER_ID }),
    };
    aiGateway = {
      chat: jest.fn().mockResolvedValue({
        text: 'Stoic reaction.',
        model: 'gpt-4o-mini',
        provider: 'openai',
        tokensIn: 10,
        tokensOut: 5,
      }),
    };
    safetyService = {
      isCrisisSignal: jest.fn().mockReturnValue(false),
      getCrisisResponse: jest.fn().mockReturnValue('Crisis resources here.'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: taskRepo },
        {
          provide: getRepositoryToken(TaskCompletion),
          useValue: completionRepo,
        },
        {
          provide: getRepositoryToken(TaskExplanation),
          useValue: explanationRepo,
        },
        { provide: getRepositoryToken(Goal), useValue: goalRepo },
        { provide: UsersService, useValue: usersService },
        { provide: AiGatewayService, useValue: aiGateway },
        { provide: SafetyService, useValue: safetyService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates task when user owns goal', async () => {
      goalRepo.findOne.mockResolvedValue(makeGoal());
      const task = makeTask();
      taskRepo.create.mockReturnValue(task);
      taskRepo.save.mockResolvedValue(task);

      const result = await service.create(SUB, {
        title: 'Run',
        goalId: GOAL_ID,
      });
      expect(result.title).toBe('Run');
    });

    it('throws NotFoundException when goal not found', async () => {
      goalRepo.findOne.mockResolvedValue(null);
      await expect(
        service.create(SUB, { title: 'Run', goalId: GOAL_ID }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user does not own goal', async () => {
      goalRepo.findOne.mockResolvedValue(makeGoal({ userId: 99 }));
      await expect(
        service.create(SUB, { title: 'Run', goalId: GOAL_ID }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAllForGoal', () => {
    it('returns tasks for owned goal', async () => {
      goalRepo.findOne.mockResolvedValue(makeGoal());
      taskRepo.find.mockResolvedValue([makeTask(), makeTask({ id: 'b' })]);

      const result = await service.findAllForGoal(SUB, GOAL_ID);
      expect(result).toHaveLength(2);
    });

    it('throws NotFound for a malformed (non-uuid) goalId without querying', async () => {
      await expect(service.findAllForGoal(SUB, 'demo-goal')).rejects.toThrow(
        NotFoundException,
      );
      expect(goalRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('complete', () => {
    beforeEach(() => {
      taskRepo.findOne.mockResolvedValue(makeTask());
      goalRepo.findOne.mockResolvedValue(makeGoal());
      const comp = makeCompletion();
      completionRepo.create.mockReturnValue(comp);
      completionRepo.save.mockResolvedValue(comp);
      taskRepo.save.mockResolvedValue(
        makeTask({ status: TaskStatus.COMPLETED }),
      );
    });

    it('creates completion and marks non-repeating task completed', async () => {
      const result = await service.complete(SUB, TASK_ID, { moodScore: 3 });
      expect(result.data.moodScore).toBe(3);
      expect(taskRepo.save).toHaveBeenCalled();
    });

    it('marks a repeating occurrence completed so the scheduler rolls it forward', async () => {
      taskRepo.findOne.mockResolvedValue(
        makeTask({ repeatFrequency: TaskRepeatFrequency.DAILY }),
      );
      await service.complete(SUB, TASK_ID, { moodScore: 3 });
      expect(taskRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: TaskStatus.COMPLETED }),
      );
    });

    it('returns no reaction when personalityId is absent', async () => {
      const result = await service.complete(SUB, TASK_ID, { moodScore: 3 });
      expect(result.mentorReaction).toBeUndefined();
    });

    it('returns mentor reaction when personalityId is provided', async () => {
      const result = await service.complete(SUB, TASK_ID, {
        moodScore: 3,
        personalityId: 'marcus',
      });
      expect(result.mentorReaction).toBe('Stoic reaction.');
      expect(aiGateway.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'task.completed',
          personalityId: 'marcus',
        }),
      );
    });

    it('returns safety response when crisis signal detected in reflection', async () => {
      safetyService.isCrisisSignal.mockReturnValue(true);
      const result = await service.complete(SUB, TASK_ID, {
        moodScore: 1,
        reflection: 'I want to hurt myself',
        personalityId: 'marcus',
      });
      expect(result.mentorReaction).toBe('Crisis resources here.');
      expect(result.safetyFlag).toBe(true);
      expect(aiGateway.chat).not.toHaveBeenCalled();
    });

    // Idempotency now comes from uq_task_completions_task_day, not a preceding
    // SELECT — the old read-then-write could be raced by a double tap.
    it('maps a unique violation to ConflictException', async () => {
      completionRepo.save.mockRejectedValue(
        Object.assign(new Error('duplicate key value'), { code: '23505' }),
      );

      await expect(
        service.complete(SUB, TASK_ID, { moodScore: 4 }),
      ).rejects.toThrow(ConflictException);
    });

    it('does not swallow other database errors', async () => {
      completionRepo.save.mockRejectedValue(
        Object.assign(new Error('connection lost'), { code: '08006' }),
      );

      await expect(
        service.complete(SUB, TASK_ID, { moodScore: 4 }),
      ).rejects.toThrow('connection lost');
    });
  });

  describe('explain', () => {
    beforeEach(() => {
      taskRepo.findOne.mockResolvedValue(makeTask());
      goalRepo.findOne.mockResolvedValue(makeGoal());
      const expl = makeExplanation();
      explanationRepo.create.mockReturnValue(expl);
      explanationRepo.save.mockResolvedValue(expl);
      taskRepo.save.mockResolvedValue(makeTask({ status: TaskStatus.SKIPPED }));
    });

    it('creates explanation and marks task skipped', async () => {
      const result = await service.explain(SUB, TASK_ID, {
        reason: ExplanationReason.FORGOT,
      });
      expect(result.data.reason).toBe(ExplanationReason.FORGOT);
      expect(taskRepo.save).toHaveBeenCalled();
    });

    it('returns no reaction when personalityId is absent', async () => {
      const result = await service.explain(SUB, TASK_ID, {
        reason: ExplanationReason.FORGOT,
      });
      expect(result.mentorReaction).toBeUndefined();
    });

    it('returns mentor reaction for explain event', async () => {
      const result = await service.explain(SUB, TASK_ID, {
        reason: ExplanationReason.CHOSE_NOT_TO,
        personalityId: 'goggs',
      });
      expect(result.mentorReaction).toBe('Stoic reaction.');
      expect(aiGateway.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'task.failed.chose_not_to',
          personalityId: 'goggs',
        }),
      );
    });

    // QA-28: with no free text the model got "I forgot complete the task."
    it.each([
      [ExplanationReason.COULDNT, `I couldn't do "Run" today.`],
      [ExplanationReason.FORGOT, `I forgot to do "Run".`],
      [ExplanationReason.CHOSE_NOT_TO, `I chose not to do "Run" today.`],
    ])(
      'tells the mentor the %s reason in plain words',
      async (reason, line) => {
        await service.explain(SUB, TASK_ID, { reason, personalityId: 'lyra' });
        expect(aiGateway.chat.mock.calls[0][0].messages).toEqual([
          { role: 'user', content: line },
        ]);
      },
    );

    it('returns safety response when crisis signal detected in freeText', async () => {
      safetyService.isCrisisSignal.mockReturnValue(true);
      const result = await service.explain(SUB, TASK_ID, {
        reason: ExplanationReason.COULDNT,
        freeText: 'cant go on',
        personalityId: 'marcus',
      });
      expect(result.safetyFlag).toBe(true);
      expect(aiGateway.chat).not.toHaveBeenCalled();
    });

    it('maps a unique violation to ConflictException', async () => {
      explanationRepo.save.mockRejectedValue(
        Object.assign(new Error('duplicate key value'), { code: '23505' }),
      );

      await expect(
        service.explain(SUB, TASK_ID, { reason: ExplanationReason.COULDNT }),
      ).rejects.toThrow(ConflictException);
    });

    // The sheet tells the user a missed one-off comes back tomorrow.
    it('schedules a one-off task again for tomorrow', async () => {
      await service.explain(SUB, TASK_ID, {
        reason: ExplanationReason.COULDNT,
      });

      const retry = taskRepo.create.mock.calls.at(-1)[0];
      expect(retry).toMatchObject({
        goalId: GOAL_ID,
        title: 'Run',
        repeatFrequency: TaskRepeatFrequency.NONE,
        occurrenceIndex: 1,
        parentTaskId: TASK_ID,
      });
      expect(retry.dueOn).toBe(addDays(localDay('UTC'), 1));
    });

    // 20:30 UTC on Oct 17 is already 01:30 on Oct 18 in Karachi, so the
    // user's tomorrow is Oct 19 — the server's would have been Oct 18.
    it("schedules the retry for the user's tomorrow, at their midnight", async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-10-17T20:30:00Z'));
      usersService.findByAccountSub.mockResolvedValue({
        id: USER_ID,
        timezone: 'Asia/Karachi',
      });
      await service.explain(SUB, TASK_ID, {
        reason: ExplanationReason.COULDNT,
      });
      jest.useRealTimers();

      const retry = taskRepo.create.mock.calls.at(-1)[0];
      expect(retry.dueOn).toBe('2026-10-19');
      expect(retry.dueDate).toEqual(new Date('2026-10-18T19:00:00Z'));
    });

    it('leaves recurring tasks to the roll-forward job', async () => {
      taskRepo.findOne.mockResolvedValue(
        makeTask({ repeatFrequency: TaskRepeatFrequency.DAILY }),
      );
      await service.explain(SUB, TASK_ID, { reason: ExplanationReason.FORGOT });
      expect(taskRepo.create).not.toHaveBeenCalled();
    });

    it('does not reschedule on a goal that is no longer active', async () => {
      goalRepo.findOne.mockResolvedValue(
        makeGoal({ status: GoalStatus.PAUSED }),
      );
      await service.explain(SUB, TASK_ID, { reason: ExplanationReason.FORGOT });
      expect(taskRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('removes task owned by user', async () => {
      taskRepo.findOne.mockResolvedValue(makeTask());
      goalRepo.findOne.mockResolvedValue(makeGoal());
      taskRepo.remove.mockResolvedValue(undefined);

      await expect(service.remove(SUB, TASK_ID)).resolves.toBeUndefined();
      expect(taskRepo.remove).toHaveBeenCalled();
    });

    it('throws ForbiddenException when user does not own goal', async () => {
      taskRepo.findOne.mockResolvedValue(makeTask());
      goalRepo.findOne.mockResolvedValue(makeGoal({ userId: 99 }));

      await expect(service.remove(SUB, TASK_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('materializeRecurringTasks', () => {
    // 05:00 UTC Sep 27 = Sep 26 22:00 in Los Angeles, Sep 27 14:00 in Tokyo.
    const NOW = new Date('2026-09-27T05:00:00Z');

    const parent = (
      id: string,
      freq: string,
      dueOn: string,
      timezone = 'UTC',
    ) => ({
      id,
      goalId: 'g1',
      title: 'Run',
      description: null,
      repeatFrequency: freq,
      dueOn,
      occurrenceIndex: 2,
      timezone,
    });

    it('inserts the next occurrence for each due parent in one statement', async () => {
      taskRepo.query.mockResolvedValueOnce([
        parent('p1', 'daily', '2026-09-27'),
        parent('p2', 'weekly', '2026-09-13'),
      ]);

      const created = await service.materializeRecurringTasks(NOW);

      expect(created).toBe(2);
      expect(taskRepo.insert).toHaveBeenCalledTimes(1);
      const rows = taskRepo.insert.mock.calls[0][0];
      expect(rows[0]).toMatchObject({
        parentTaskId: 'p1',
        occurrenceIndex: 3,
        dueOn: '2026-09-28',
        dueDate: new Date('2026-09-28T00:00:00Z'),
      });
      // Missed runs catch up to today, not to a day in the past.
      expect(rows[1].dueOn).toBe('2026-09-27');
      // Only parents with no next occurrence, on active goals, come back.
      const sql = taskRepo.query.mock.calls[0][0];
      expect(sql).toContain('NOT EXISTS');
      expect(sql).toContain("g.status = 'active'");
    });

    it("waits for the day to arrive in the user's own zone", async () => {
      taskRepo.query.mockResolvedValueOnce([
        parent('la', 'daily', '2026-09-27', 'America/Los_Angeles'),
        parent('tokyo', 'daily', '2026-09-27', 'Asia/Tokyo'),
      ]);

      expect(await service.materializeRecurringTasks(NOW)).toBe(1);

      const [row] = taskRepo.insert.mock.calls[0][0];
      expect(row.parentTaskId).toBe('tokyo');
      expect(row.dueOn).toBe('2026-09-28');
      expect(row.dueDate).toEqual(new Date('2026-09-27T15:00:00Z')); // Tokyo midnight
    });

    // A zone Postgres or the runtime doesn't know must not stop the job.
    it('falls back to UTC for an unknown zone', async () => {
      taskRepo.query.mockResolvedValueOnce([
        parent('p1', 'daily', '2026-09-27', 'Mars/Olympus'),
      ]);
      expect(await service.materializeRecurringTasks(NOW)).toBe(1);
    });

    it('pages by id until a short page', async () => {
      const full = Array.from({ length: 500 }, (_, i) =>
        parent(`p${String(i).padStart(3, '0')}`, 'daily', '2026-09-26'),
      );
      taskRepo.query.mockResolvedValueOnce(full).mockResolvedValueOnce([]);

      await service.materializeRecurringTasks(NOW);

      expect(taskRepo.query).toHaveBeenCalledTimes(2);
      expect(taskRepo.query.mock.calls[1][1][0]).toBe('p499');
    });

    it('selects missed and skipped parents too, not only completed ones', async () => {
      taskRepo.query.mockResolvedValueOnce([]);
      await service.materializeRecurringTasks();
      expect(taskRepo.query.mock.calls[0][0]).not.toContain(
        "status = 'completed'",
      );
    });

    it('does nothing when there is nothing to roll over', async () => {
      taskRepo.query.mockResolvedValueOnce([]);
      expect(await service.materializeRecurringTasks()).toBe(0);
      expect(taskRepo.insert).not.toHaveBeenCalled();
    });
  });

  // An unanswered one-off used to drop off today once its day passed, with
  // nothing ever asking about it again.
  describe('carryOverOneOffs', () => {
    // 05:00 UTC Sep 27 = Sep 26 22:00 in Los Angeles, Sep 27 14:00 in Tokyo.
    const NOW = new Date('2026-09-27T05:00:00Z');
    const row = (id: string, dueOn: string, timezone: string) => ({
      id,
      dueOn,
      timezone,
    });

    it("moves past-due pending one-offs to each user's own today", async () => {
      taskRepo.query.mockResolvedValueOnce([
        row('tokyo-old', '2026-09-25', 'Asia/Tokyo'),
        row('tokyo-also', '2026-09-26', 'Asia/Tokyo'),
        row('utc-old', '2026-09-20', 'UTC'),
      ]);

      expect(await service.carryOverOneOffs(NOW)).toBe(3);

      // One UPDATE per zone, each to that zone's today at its midnight.
      const calls = taskRepo.update.mock.calls;
      expect(calls).toHaveLength(2);
      const tokyo = calls.find(([, set]) => set.dueOn === '2026-09-27');
      expect(tokyo[0].id.value ?? tokyo[0].id._value).toEqual([
        'tokyo-old',
        'tokyo-also',
      ]);
      expect(tokyo[1].dueDate).toEqual(new Date('2026-09-26T15:00:00Z'));
    });

    it("leaves a task whose day hasn't ended in the user's zone", async () => {
      // Sep 26 is still today in Los Angeles at 05:00 UTC Sep 27.
      taskRepo.query.mockResolvedValueOnce([
        row('la-today', '2026-09-26', 'America/Los_Angeles'),
      ]);
      expect(await service.carryOverOneOffs(NOW)).toBe(0);
      expect(taskRepo.update).not.toHaveBeenCalled();
    });

    it('only selects pending one-offs on active goals', async () => {
      taskRepo.query.mockResolvedValueOnce([]);
      await service.carryOverOneOffs(NOW);
      const sql = taskRepo.query.mock.calls[0][0];
      expect(sql).toContain(`"repeatFrequency" = 'none'`);
      expect(sql).toContain(`t.status = 'pending'`);
      expect(sql).toContain(`g.status = 'active'`);
    });
  });

  describe('nextDueOn', () => {
    it('clamps monthly to the last day of a short month', () => {
      expect(
        service.nextDueOn(
          '2026-01-31',
          TaskRepeatFrequency.MONTHLY,
          '2026-02-01',
        ),
      ).toBe('2026-02-28');
    });
    it('keeps the original day-of-month after a short month', () => {
      expect(
        service.nextDueOn(
          '2026-01-31',
          TaskRepeatFrequency.MONTHLY,
          '2026-03-01',
        ),
      ).toBe('2026-03-31');
    });
    it('catches up to today after missed runs', () => {
      expect(
        service.nextDueOn(
          '2026-02-20',
          TaskRepeatFrequency.DAILY,
          '2026-03-01',
        ),
      ).toBe('2026-03-01');
    });
    it('steps one day across a DST change', () => {
      // US clocks went forward on 2026-03-08.
      expect(
        service.nextDueOn(
          '2026-03-08',
          TaskRepeatFrequency.DAILY,
          '2026-03-08',
        ),
      ).toBe('2026-03-09');
    });
  });
});
