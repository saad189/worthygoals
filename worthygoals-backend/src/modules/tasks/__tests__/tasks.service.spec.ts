import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ExplanationReason,
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
import { TasksService } from '../tasks.service';

const USER_ID = 1;
const GOAL_ID = 'goal-uuid';
const TASK_ID = 'task-uuid';
const SUB = 'cognito-sub';

const makeGoal = (o: Partial<Goal> = {}) =>
  ({ id: GOAL_ID, userId: USER_ID, ...o }) as Goal;

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
  });

  describe('complete', () => {
    it('creates completion and marks non-repeating task completed', async () => {
      const task = makeTask();
      taskRepo.findOne.mockResolvedValue(task);
      goalRepo.findOne.mockResolvedValue(makeGoal());
      const comp = makeCompletion();
      completionRepo.create.mockReturnValue(comp);
      completionRepo.save.mockResolvedValue(comp);
      taskRepo.save.mockResolvedValue({
        ...task,
        status: TaskStatus.COMPLETED,
      });

      const result = await service.complete(SUB, TASK_ID, { moodScore: 3 });
      expect(result.moodScore).toBe(3);
      expect(taskRepo.save).toHaveBeenCalled();
    });

    it('throws ConflictException when already completed today', async () => {
      taskRepo.findOne.mockResolvedValue(makeTask());
      goalRepo.findOne.mockResolvedValue(makeGoal());
      // Override completionRepo qb to return an existing completion
      const qbWithResult = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(makeCompletion()),
      };
      completionRepo.createQueryBuilder.mockReturnValue(qbWithResult);

      await expect(
        service.complete(SUB, TASK_ID, { moodScore: 4 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('explain', () => {
    it('creates explanation and marks task skipped', async () => {
      const task = makeTask();
      taskRepo.findOne.mockResolvedValue(task);
      goalRepo.findOne.mockResolvedValue(makeGoal());
      const expl = makeExplanation();
      explanationRepo.create.mockReturnValue(expl);
      explanationRepo.save.mockResolvedValue(expl);
      taskRepo.save.mockResolvedValue({ ...task, status: TaskStatus.SKIPPED });

      const result = await service.explain(SUB, TASK_ID, {
        reason: ExplanationReason.FORGOT,
      });
      expect(result.reason).toBe(ExplanationReason.FORGOT);
      expect(taskRepo.save).toHaveBeenCalled();
    });

    it('throws ConflictException when already explained today', async () => {
      taskRepo.findOne.mockResolvedValue(makeTask());
      goalRepo.findOne.mockResolvedValue(makeGoal());
      const qbWithResult = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(makeExplanation()),
      };
      explanationRepo.createQueryBuilder.mockReturnValue(qbWithResult);

      await expect(
        service.explain(SUB, TASK_ID, { reason: ExplanationReason.COULDNT }),
      ).rejects.toThrow(ConflictException);
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
});
