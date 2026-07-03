import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationLog } from 'src/database/models/notification-log.entity';
import { PushToken } from 'src/database/models/push-token.entity';
import { NotificationsService } from '../notifications.service';
import { NOTIFICATION_QUEUE } from '../types/notification-job.types';

const USER_ID = 1;

const makeToken = (o: Partial<PushToken> = {}) =>
  ({
    id: 'tok-uuid',
    userId: USER_ID,
    token: 'ExponentPushToken[xxx]',
    platform: 'expo' as const,
    timezone: 'America/New_York',
    active: true,
    ...o,
  }) as PushToken;

describe('NotificationsService', () => {
  let service: NotificationsService;
  let tokenRepo: Record<string, jest.Mock>;
  let logRepo: Record<string, jest.Mock>;
  let queue: { add: jest.Mock; getJob: jest.Mock };

  beforeEach(async () => {
    tokenRepo = {
      upsert: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      find: jest.fn().mockResolvedValue([]),
    };
    logRepo = {
      count: jest.fn().mockResolvedValue(0),
      save: jest.fn().mockResolvedValue(undefined),
      manager: { query: jest.fn().mockResolvedValue([]) } as any,
    };
    queue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
      getJob: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(PushToken), useValue: tokenRepo },
        { provide: getRepositoryToken(NotificationLog), useValue: logRepo },
        { provide: getQueueToken(NOTIFICATION_QUEUE), useValue: queue },
      ],
    }).compile();

    service = module.get(NotificationsService);
  });

  describe('registerToken', () => {
    it('upserts the token record', async () => {
      await service.registerToken(USER_ID, {
        token: 'ExponentPushToken[abc]',
        platform: 'expo',
        timezone: 'America/Chicago',
      });
      expect(tokenRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: USER_ID,
          token: 'ExponentPushToken[abc]',
        }),
        ['userId', 'token'],
      );
    });
  });

  describe('unregisterToken', () => {
    it('marks the token inactive', async () => {
      await service.unregisterToken(USER_ID, 'ExponentPushToken[abc]');
      expect(tokenRepo.update).toHaveBeenCalledWith(
        { userId: USER_ID, token: 'ExponentPushToken[abc]' },
        { active: false },
      );
    });
  });

  describe('checkPacingAllowed', () => {
    it('allows when under daily cap', async () => {
      logRepo.count.mockResolvedValue(2);
      const allowed = await service.checkPacingAllowed(USER_ID, 'UTC');
      expect(allowed).toBe(true);
    });

    it('blocks when at daily cap', async () => {
      logRepo.count.mockResolvedValue(3);
      const allowed = await service.checkPacingAllowed(USER_ID, 'UTC');
      expect(allowed).toBe(false);
    });
  });

  describe('materializeNext24h', () => {
    it('does nothing when no tokens exist', async () => {
      tokenRepo.find.mockResolvedValue([]);
      await service.materializeNext24h();
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('schedules morning and evening jobs for a user with a token', async () => {
      tokenRepo.find.mockResolvedValue([makeToken({ timezone: 'UTC' })]);
      await service.materializeNext24h();
      expect(queue.add).toHaveBeenCalledTimes(2);
      const kinds = queue.add.mock.calls.map((c) => c[0]);
      expect(kinds).toContain('morning_setup');
      expect(kinds).toContain('evening_check_in');
    });

    it('skips jobs that already exist in the queue', async () => {
      tokenRepo.find.mockResolvedValue([makeToken({ timezone: 'UTC' })]);
      queue.getJob.mockResolvedValue({ id: 'existing' });
      await service.materializeNext24h();
      expect(queue.add).not.toHaveBeenCalled();
    });
  });

  describe('scheduleLapseReEngagement', () => {
    const daysAgo = (n: number) =>
      new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

    beforeEach(() => {
      tokenRepo.find.mockResolvedValue([makeToken({ timezone: 'UTC' })]);
    });

    it('enqueues a voiced re_engage with daysSince for a user quiet 3+ days', async () => {
      (logRepo.manager as any).query.mockResolvedValue([
        { userId: USER_ID, lastTs: daysAgo(4) },
      ]);
      await service.scheduleLapseReEngagement();
      expect(queue.add).toHaveBeenCalledWith(
        're_engage',
        expect.objectContaining({
          userId: USER_ID,
          kind: 're_engage',
          payload: { daysSince: 4 },
        }),
        expect.objectContaining({ jobId: expect.stringContaining(':re_engage:') }),
      );
    });

    it('leaves recently-active users alone', async () => {
      (logRepo.manager as any).query.mockResolvedValue([
        { userId: USER_ID, lastTs: daysAgo(1) },
      ]);
      await service.scheduleLapseReEngagement();
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('skips users who were never active', async () => {
      (logRepo.manager as any).query.mockResolvedValue([
        { userId: USER_ID, lastTs: null },
      ]);
      await service.scheduleLapseReEngagement();
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('suppresses a re_engage sent within the last week', async () => {
      (logRepo.manager as any).query.mockResolvedValue([
        { userId: USER_ID, lastTs: daysAgo(5) },
      ]);
      logRepo.count.mockResolvedValue(1);
      await service.scheduleLapseReEngagement();
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('does not double-enqueue when the job already exists', async () => {
      (logRepo.manager as any).query.mockResolvedValue([
        { userId: USER_ID, lastTs: daysAgo(5) },
      ]);
      queue.getJob.mockResolvedValue({ id: 'existing' });
      await service.scheduleLapseReEngagement();
      expect(queue.add).not.toHaveBeenCalled();
    });
  });

  describe('recordSent', () => {
    it('saves a notification log entry', async () => {
      await service.recordSent(
        USER_ID,
        'morning_setup',
        'UTC',
        'ExponentPushToken[abc]',
      );
      expect(logRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: USER_ID,
          kind: 'morning_setup',
          token: 'ExponentPushToken[abc]',
          status: 'sent',
        }),
      );
    });
  });
});
