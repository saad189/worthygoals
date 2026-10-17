import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationCopyCache } from 'src/database/models/notification-copy-cache.entity';
import { PersonalityService } from 'src/core/personalities/personality.service';
import { AiGatewayService } from 'src/core/ai/gateway/ai-gateway.service';
import { NotificationVoicingService } from '../notification-voicing.service';

const PERSONALITY_ID = 'marcus';

const makeCache = (body: string): NotificationCopyCache =>
  ({
    id: 'cache-uuid',
    personalityId: PERSONALITY_ID,
    event: 'notification.morning_setup',
    day: '2026-05-21',
    contextHash: 'abc12345',
    body,
    abVariant: 'A',
    createdAt: new Date(),
  }) as NotificationCopyCache;

describe('NotificationVoicingService', () => {
  let service: NotificationVoicingService;
  let cacheRepo: Record<string, jest.Mock>;
  let personalityService: Partial<PersonalityService>;
  let gateway: { chat: jest.Mock };

  beforeEach(async () => {
    cacheRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    };

    personalityService = {
      hasPersonality: jest.fn().mockReturnValue(true),
      listAll: jest
        .fn()
        .mockReturnValue([{ id: 'marcus' }, { id: 'lyra' }, { id: 'goggs' }]),
    };

    gateway = {
      chat: jest.fn().mockResolvedValue({
        text: 'Up. The work awaits.',
        model: 'gpt-4o-mini',
        provider: 'openai',
        tokensIn: 10,
        tokensOut: 8,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationVoicingService,
        {
          provide: getRepositoryToken(NotificationCopyCache),
          useValue: cacheRepo,
        },
        { provide: PersonalityService, useValue: personalityService },
        { provide: AiGatewayService, useValue: gateway },
      ],
    }).compile();

    service = module.get<NotificationVoicingService>(
      NotificationVoicingService,
    );
  });

  describe('getOrGenerateCopy', () => {
    it('returns cached copy without calling AI', async () => {
      cacheRepo.findOne.mockResolvedValue(makeCache('The work waits — move.'));

      const result = await service.getOrGenerateCopy(
        PERSONALITY_ID,
        'morning_setup',
        {},
      );

      expect(result.body).toBe('The work waits — move.');
      expect(result.abVariant).toBe('A');
      expect(gateway.chat).not.toHaveBeenCalled();
    });

    it('calls AI on cache miss and saves result', async () => {
      cacheRepo.findOne.mockResolvedValue(null);

      const result = await service.getOrGenerateCopy(
        PERSONALITY_ID,
        'morning_setup',
        {},
      );

      // Through the gateway (failover, cost logging), as a system call that
      // the gateway voices with the persona for this event.
      expect(gateway.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: -1,
          feature: 'notification',
          personalityId: PERSONALITY_ID,
          event: 'notification.morning_setup',
        }),
      );
      expect(result.body).toBe('Up. The work awaits.');
      expect(cacheRepo.save).toHaveBeenCalled();
    });

    it('uses fallback body for an unknown personality', async () => {
      (personalityService.hasPersonality as jest.Mock).mockReturnValue(false);

      const result = await service.getOrGenerateCopy(
        PERSONALITY_ID,
        'morning_setup',
        {},
      );

      expect(gateway.chat).not.toHaveBeenCalled();
      expect(result.body).toBe('Good morning — your goals are waiting.');
    });

    it('uses fallback body when AI call throws', async () => {
      gateway.chat.mockRejectedValue(new Error('API timeout'));

      const result = await service.getOrGenerateCopy(
        PERSONALITY_ID,
        'morning_setup',
        {},
      );

      expect(result.body).toBe('Good morning — your goals are waiting.');
    });

    it('injects daysSince into re_engage context', async () => {
      await service.getOrGenerateCopy(PERSONALITY_ID, 're_engage', {
        daysSince: 7,
      });

      const call = gateway.chat.mock.calls[0][0];
      expect(call.context).toEqual({ daysSince: 7 });
      expect(call.messages[0].content).toContain('daysSince=7');
    });

    it('uses different cache entries for different context hashes', async () => {
      cacheRepo.findOne.mockResolvedValue(null);

      await service.getOrGenerateCopy(PERSONALITY_ID, 're_engage', {
        daysSince: 3,
      });
      await service.getOrGenerateCopy(PERSONALITY_ID, 're_engage', {
        daysSince: 10,
      });

      expect(cacheRepo.save).toHaveBeenCalledTimes(2);
    });

    it('ignores duplicate-key error on concurrent cache writes', async () => {
      cacheRepo.save.mockRejectedValue(new Error('Duplicate entry'));

      await expect(
        service.getOrGenerateCopy(PERSONALITY_ID, 'morning_setup', {}),
      ).resolves.not.toThrow();
    });
  });

  describe('preGenerateForNextDay', () => {
    it('pre-generates morning and evening copy for all personalities', async () => {
      await service.preGenerateForNextDay();

      // 3 personalities × 2 kinds = 6 AI calls
      expect(gateway.chat).toHaveBeenCalledTimes(6);
      expect(cacheRepo.save).toHaveBeenCalledTimes(6);
    });

    it('skips personalities that already have cached copy for tomorrow', async () => {
      cacheRepo.findOne.mockResolvedValue(makeCache('Already generated'));

      await service.preGenerateForNextDay();

      expect(gateway.chat).not.toHaveBeenCalled();
    });
  });
});
