import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationLog } from 'src/database/models/notification-log.entity';
import { PushToken } from 'src/database/models/push-token.entity';
import { NotificationsService } from '../notifications.service';
import { NOTIFICATION_QUEUE } from '../types/notification-job.types';

const USER_ID = 1;

describe('NotificationsService', () => {
  let service: NotificationsService;
  let tokenRepo: Record<string, jest.Mock>;
  let logRepo: Record<string, jest.Mock>;
  let queue: { add: jest.Mock; addBulk: jest.Mock };

  beforeEach(async () => {
    tokenRepo = {
      upsert: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      find: jest.fn().mockResolvedValue([]),
      // activeUserPages: first call returns the page, the next an empty one.
      manager: { query: jest.fn().mockResolvedValue([]) } as any,
    };
    logRepo = {
      count: jest.fn().mockResolvedValue(0),
      save: jest.fn().mockResolvedValue(undefined),
      manager: { query: jest.fn().mockResolvedValue([]) } as any,
    };
    queue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
      addBulk: jest.fn().mockResolvedValue([]),
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
    const onePage = (rows: Array<{ userId: number; timezone: string }>) =>
      (tokenRepo.manager as any).query.mockResolvedValueOnce(rows);

    it('does nothing when no tokens exist', async () => {
      await service.materializeNext24h();
      expect(queue.addBulk).not.toHaveBeenCalled();
    });

    it('bulk-schedules morning and evening jobs with stable jobIds', async () => {
      onePage([{ userId: USER_ID, timezone: 'UTC' }]);
      await service.materializeNext24h();
      expect(queue.addBulk).toHaveBeenCalledTimes(1);
      const jobs = queue.addBulk.mock.calls[0][0];
      expect(jobs.map((j) => j.name).sort()).toEqual([
        'evening_check_in',
        'morning_setup',
      ]);
      for (const j of jobs) {
        expect(j.opts.jobId).toMatch(/^1:(morning_setup|evening_check_in):/);
      }
    });

    it('pages by userId until a short page', async () => {
      const full = Array.from({ length: 500 }, (_, i) => ({
        userId: i + 1,
        timezone: 'UTC',
      }));
      onePage(full);
      onePage([{ userId: 501, timezone: 'UTC' }]);
      await service.materializeNext24h();
      const calls = (tokenRepo.manager as any).query.mock.calls;
      expect(calls).toHaveLength(2);
      expect(calls[1][1][0]).toBe(500);
      expect(queue.addBulk).toHaveBeenCalledTimes(2);
    });
  });

  describe('scheduleLapseReEngagement', () => {
    const daysAgo = (n: number) =>
      new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

    beforeEach(() => {
      (tokenRepo.manager as any).query.mockResolvedValueOnce([
        { userId: USER_ID, timezone: 'UTC' },
      ]);
    });

    it('enqueues a voiced re_engage with daysSince for a user quiet 3+ days', async () => {
      (logRepo.manager as any).query.mockResolvedValueOnce([
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
        expect.objectContaining({
          jobId: expect.stringContaining(':re_engage:'),
        }),
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
      (logRepo.manager as any).query
        .mockResolvedValueOnce([{ userId: USER_ID, lastTs: daysAgo(5) }])
        .mockResolvedValueOnce([{ userId: USER_ID }]);
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
