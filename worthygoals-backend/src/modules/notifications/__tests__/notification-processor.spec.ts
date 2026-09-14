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
// expo-server-sdk ships ESM, which ts-jest's CommonJS transform cannot load.
jest.mock('expo-server-sdk', () => {
  class MockExpo {
    static isExpoPushToken = (t: string) => typeof t === 'string' && t.startsWith('ExponentPushToken');
    chunkPushNotifications = (messages: unknown[]) => (messages.length ? [messages] : []);
    sendPushNotificationsAsync = jest.fn().mockResolvedValue([{ status: 'ok' }]);
  }
  return { __esModule: true, default: MockExpo };
});

import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';

import { UsersService } from 'src/modules/users/users.service';
import { NotificationProcessor } from '../notification-processor';
import { NotificationVoicingService } from '../notification-voicing.service';
import { NotificationsService } from '../notifications.service';

const USER_ID = 7;

const job = (overrides = {}) =>
  ({
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
    checkPacingAllowed: jest.fn().mockResolvedValue(true),
    recordSent: jest.fn(),
  };
  const usersService = { findOne: jest.fn() };
  const voicingService = { getOrGenerateCopy: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    notifService.checkPacingAllowed.mockResolvedValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationProcessor,
        { provide: NotificationsService, useValue: notifService },
        { provide: UsersService, useValue: usersService },
        { provide: NotificationVoicingService, useValue: voicingService },
        { provide: ConfigService, useValue: { get: () => undefined } },
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

  it('voices the copy from users.personalityId', async () => {
    notifService.getTokens.mockResolvedValue([
      { token: 'ExponentPushToken[xxx]', timezone: 'Europe/London' },
    ]);
    usersService.findOne.mockResolvedValue({ id: USER_ID, personalityId: 'goggs' });
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
    usersService.findOne.mockResolvedValue({ id: USER_ID, personalityId: null });

    await processor.process(job());

    expect(voicingService.getOrGenerateCopy).not.toHaveBeenCalled();
  });
});
