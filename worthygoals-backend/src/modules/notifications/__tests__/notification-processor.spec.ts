/**
 * Guards C2 and C3 — two of the three stacked silent failures on the push path.
 *
 * C2: the processor returned silently when a user had no tokens, at no log
 * level, so the queue drained green while sending nothing. That is why C1
 * (token registration writing a Cognito UUID into an integer column, leaving
 * push_tokens empty) went unnoticed for two months.
 *
 * C3: voicing looked up user_personalities, whose only writer has zero callers
 * in the monorepo. The table is empty, so the lookup always returned null and
 * every push shipped generic fallback copy. users.personalityId is the column
 * the app actually writes.
 */
const mockSend = jest.fn();
const mockReceipts = jest.fn();

// expo-server-sdk ships ESM, which ts-jest's CommonJS transform cannot load.
jest.mock('expo-server-sdk', () => {
  class MockExpo {
    static isExpoPushToken = (t: string) =>
      typeof t === 'string' && t.startsWith('ExponentPushToken');
    chunkPushNotifications = (messages: unknown[]) =>
      messages.length ? [messages] : [];
    sendPushNotificationsAsync = mockSend;
    chunkPushNotificationReceiptIds = (ids: string[]) => [ids];
    getPushNotificationReceiptsAsync = mockReceipts;
  }
  return { __esModule: true, default: MockExpo };
});

import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { UsersService } from 'src/modules/users/users.service';
import { NotificationProcessor } from '../notification-processor';
import { NotificationVoicingService } from '../notification-voicing.service';
import { NotificationsService } from '../notifications.service';
import {
  NOTIFICATION_QUEUE,
  PUSH_RECEIPTS_JOB,
} from '../types/notification-job.types';

const USER_ID = 7;

const job = (overrides = {}) =>
  ({
    name: 'morning_setup',
    data: {
      userId: USER_ID,
      kind: 'morning_setup',
      scheduledFor: '2026-09-14T06:00:00Z',
      ...overrides,
    },
  }) as Job<any>;

describe('NotificationProcessor', () => {
  let processor: NotificationProcessor;

  const notifService = {
    getTokens: jest.fn(),
    userTimezone: jest.fn().mockResolvedValue('UTC'),
    todayWork: jest.fn(),
    checkPacingAllowed: jest.fn().mockResolvedValue(true),
    tokensSentToday: jest.fn().mockResolvedValue(new Set()),
    recordSent: jest.fn(),
    deactivateToken: jest.fn(),
  };
  const queue = { add: jest.fn() };
  const usersService = { findOne: jest.fn() };
  const voicingService = { getOrGenerateCopy: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    notifService.checkPacingAllowed.mockResolvedValue(true);
    notifService.tokensSentToday.mockResolvedValue(new Set());
    notifService.todayWork.mockResolvedValue({
      activeGoals: 1,
      total: 1,
      pending: 1,
    });
    mockSend.mockResolvedValue([{ status: 'ok', id: 'ticket-1' }]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationProcessor,
        { provide: NotificationsService, useValue: notifService },
        { provide: UsersService, useValue: usersService },
        { provide: NotificationVoicingService, useValue: voicingService },
        { provide: ConfigService, useValue: { get: () => undefined } },
        { provide: getQueueToken(NOTIFICATION_QUEUE), useValue: queue },
      ],
    }).compile();

    processor = module.get(NotificationProcessor);
  });

  it('logs when a user has no push tokens instead of returning silently', async () => {
    const warn = jest
      .spyOn((processor as any).logger, 'warn')
      .mockImplementation(() => undefined);
    notifService.getTokens.mockResolvedValue([]);

    await processor.process(job());

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain(String(USER_ID));
  });

  // The push gap: task_due and weekly_review had copy but nothing sent them,
  // and the daily pushes went out whether or not there was anything to do.
  describe('which push a slot becomes', () => {
    const sentKinds = () =>
      notifService.recordSent.mock.calls.map((c) => c[1] as string);
    const work = (activeGoals: number, total: number, pending: number) =>
      notifService.todayWork.mockResolvedValue({ activeGoals, total, pending });

    beforeEach(() => {
      notifService.getTokens.mockResolvedValue([
        { token: 'ExponentPushToken[xxx]' },
      ]);
      usersService.findOne.mockResolvedValue({ id: USER_ID });
    });

    it.each([
      ['evening with open tasks', 'evening_check_in', [1, 2, 1], 'task_due'],
      [
        'evening with all answered',
        'evening_check_in',
        [1, 2, 0],
        'evening_check_in',
      ],
      ['evening on an empty day', 'evening_check_in', [1, 0, 0], null],
      ['morning with work due', 'morning_setup', [1, 1, 1], 'morning_setup'],
      ['morning with nothing due', 'morning_setup', [1, 0, 0], null],
      [
        'weekly review with an active goal',
        'weekly_review',
        [1, 0, 0],
        'weekly_review',
      ],
      // Everything paused or let go: the mentor really goes quiet.
      ['weekly review, all goals paused', 'weekly_review', [0, 0, 0], null],
      ['evening, all goals paused', 'evening_check_in', [0, 0, 0], null],
    ] as const)('%s', async (_, kind, [goals, total, pending], expected) => {
      work(goals, total, pending);
      await processor.process(job({ kind }));
      expect(sentKinds()).toEqual(expected ? [expected] : []);
    });

    it('never gates a lapse re-engagement', async () => {
      work(0, 0, 0);
      await processor.process(job({ kind: 're_engage' }));
      expect(sentKinds()).toEqual(['re_engage']);
      expect(notifService.todayWork).not.toHaveBeenCalled();
    });

    it('sends the resolved kind in the push data, which the app routes on', async () => {
      work(1, 1, 1);
      await processor.process(job({ kind: 'evening_check_in' }));
      expect(mockSend.mock.calls[0][0][0].data.kind).toBe('task_due');
    });
  });

  it('voices the copy from users.personalityId', async () => {
    notifService.getTokens.mockResolvedValue([
      { token: 'ExponentPushToken[xxx]', timezone: 'Europe/London' },
    ]);
    usersService.findOne.mockResolvedValue({
      id: USER_ID,
      personalityId: 'goggs',
    });
    voicingService.getOrGenerateCopy.mockResolvedValue({ body: 'GET UP.' });

    await processor.process(job());

    expect(usersService.findOne).toHaveBeenCalledWith(USER_ID);
    expect(voicingService.getOrGenerateCopy).toHaveBeenCalledWith(
      'goggs',
      'morning_setup',
      {},
    );
  });

  it('falls back only when the user genuinely has no personality', async () => {
    notifService.getTokens.mockResolvedValue([
      { token: 'ExponentPushToken[xxx]', timezone: 'UTC' },
    ]);
    usersService.findOne.mockResolvedValue({
      id: USER_ID,
      personalityId: null,
    });

    await processor.process(job());

    expect(voicingService.getOrGenerateCopy).not.toHaveBeenCalled();
  });

  describe('delivery tracking', () => {
    beforeEach(() => {
      notifService.getTokens.mockResolvedValue([
        { token: 'ExponentPushToken[xxx]', timezone: 'UTC' },
      ]);
      usersService.findOne.mockResolvedValue({ id: USER_ID });
    });

    it('schedules a receipt check for accepted tickets', async () => {
      await processor.process(job());

      expect(queue.add).toHaveBeenCalledWith(
        PUSH_RECEIPTS_JOB,
        { tickets: [{ id: 'ticket-1', token: 'ExponentPushToken[xxx]' }] },
        expect.objectContaining({ delay: expect.any(Number) }),
      );
    });

    it('does not re-push a token a retried job already reached', async () => {
      notifService.tokensSentToday.mockResolvedValue(
        new Set(['ExponentPushToken[xxx]']),
      );
      await processor.process(job());
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('rethrows a failed send so BullMQ retries it', async () => {
      mockSend.mockRejectedValue(new Error('ECONNRESET'));

      await expect(processor.process(job())).rejects.toThrow('ECONNRESET');
      expect(notifService.recordSent).not.toHaveBeenCalled();
    });

    it('retires a token the ticket reports as unregistered', async () => {
      mockSend.mockResolvedValue([
        {
          status: 'error',
          message: 'gone',
          details: { error: 'DeviceNotRegistered' },
        },
      ]);

      await processor.process(job());

      expect(notifService.deactivateToken).toHaveBeenCalledWith(
        'ExponentPushToken[xxx]',
      );
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('retires a token the receipt reports as unregistered', async () => {
      mockReceipts.mockResolvedValue({
        'ticket-1': {
          status: 'error',
          message: 'gone',
          details: { error: 'DeviceNotRegistered' },
        },
        'ticket-2': { status: 'ok' },
      });

      await processor.process({
        name: PUSH_RECEIPTS_JOB,
        data: {
          tickets: [
            { id: 'ticket-1', token: 'ExponentPushToken[dead]' },
            { id: 'ticket-2', token: 'ExponentPushToken[live]' },
          ],
        },
      } as Job<any>);

      expect(notifService.deactivateToken).toHaveBeenCalledTimes(1);
      expect(notifService.deactivateToken).toHaveBeenCalledWith(
        'ExponentPushToken[dead]',
      );
    });
  });
});
