import { Test } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiCall } from 'src/database/models/ai-call.entity';
import { DriftSample } from 'src/database/models/drift-sample.entity';
import { User } from 'src/database/models/user.entity';
import { UserTier } from 'src/common/constants/enums';
import { AiGatewayService } from '../gateway/ai-gateway.service';
import { OpenAiProvider } from '../gateway/openai.provider';
import { AnthropicProvider } from '../gateway/anthropic.provider';
import { QuotaExceededException, QuotaService } from '../quota/quota.service';
import { PersonalityService } from 'src/core/personalities/personality.service';
import { MemoryService } from 'src/core/memory/memory.service';

const MESSAGES = [{ role: 'user' as const, content: 'hello' }];
const fakeResponse = {
  text: 'hi',
  model: 'gpt-4o-mini',
  tokensIn: 10,
  tokensOut: 5,
};

const makeMockProvider = (name: string, available = true, impl?: any) => ({
  name,
  available,
  defaultModel: name === 'openai' ? 'gpt-4o-mini' : 'claude-3-5-haiku-20241022',
  chat: impl ?? jest.fn().mockResolvedValue(fakeResponse),
  chatStream: jest
    .fn()
    .mockImplementation(async (_params: any, onChunk: (c: string) => void) => {
      onChunk('chunk1');
      onChunk('chunk2');
      return { ...fakeResponse, text: 'chunk1chunk2' };
    }),
});

describe('AiGatewayService', () => {
  let service: AiGatewayService;
  let mockOpenai: ReturnType<typeof makeMockProvider>;
  let mockAnthropic: ReturnType<typeof makeMockProvider>;
  let mockQuota: Partial<QuotaService>;
  let mockUserRepo: any;
  let mockCallRepo: any;
  let mockDriftRepo: any;

  const build = async (activeProvider = 'openai') => {
    mockOpenai = makeMockProvider('openai');
    mockAnthropic = makeMockProvider(
      'anthropic',
      true,
      jest.fn().mockResolvedValue({
        ...fakeResponse,
        model: 'claude-3-5-haiku-20241022',
        provider: 'anthropic',
      }),
    );
    mockQuota = { checkAndEnforce: jest.fn().mockResolvedValue(undefined) };
    mockUserRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 1, tier: UserTier.FREE }),
    };
    mockCallRepo = {
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue({}),
    };
    mockDriftRepo = {
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue({}),
    };

    const module = await Test.createTestingModule({
      providers: [
        AiGatewayService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(activeProvider) },
        },
        { provide: OpenAiProvider, useValue: mockOpenai },
        { provide: AnthropicProvider, useValue: mockAnthropic },
        { provide: QuotaService, useValue: mockQuota },
        { provide: getRepositoryToken(AiCall), useValue: mockCallRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(DriftSample), useValue: mockDriftRepo },
      ],
    }).compile();

    service = module.get(AiGatewayService);
  };

  it('routes to OpenAI by default', async () => {
    await build('openai');
    const res = await service.chat({
      userId: 1,
      feature: 'chat',
      messages: MESSAGES,
    });
    expect(mockOpenai.chat).toHaveBeenCalled();
    expect(res.text).toBe('hi');
    expect(res.provider).toBe('openai');
  });

  it('routes to Anthropic when AI_ACTIVE_PROVIDER=anthropic', async () => {
    await build('anthropic');
    const res = await service.chat({
      userId: 1,
      feature: 'chat',
      messages: MESSAGES,
    });
    expect(mockAnthropic.chat).toHaveBeenCalled();
    expect(res.provider).toBe('anthropic');
  });

  it('logs the ai_call to the database', async () => {
    await build();
    await service.chat({ userId: 1, feature: 'chat', messages: MESSAGES });
    expect(mockCallRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        feature: 'chat',
        provider: 'openai',
      }),
    );
    expect(mockCallRepo.save).toHaveBeenCalled();
  });

  it('throws 402 when quota is exceeded', async () => {
    await build();
    (mockQuota.checkAndEnforce as jest.Mock).mockRejectedValue(
      new QuotaExceededException(1, UserTier.FREE, 20, 20),
    );
    await expect(
      service.chat({ userId: 1, feature: 'chat', messages: MESSAGES }),
    ).rejects.toBeInstanceOf(HttpException);
    const err = await service
      .chat({ userId: 1, feature: 'chat', messages: MESSAGES })
      .catch((e) => e);
    expect(err.getStatus()).toBe(402);
  });

  it('fails over to Anthropic when OpenAI throws', async () => {
    await build('openai');
    (mockOpenai.chat as jest.Mock).mockRejectedValue(
      new Error('OpenAI timeout'),
    );
    const res = await service.chat({
      userId: 1,
      feature: 'chat',
      messages: MESSAGES,
    });
    expect(res.provider).toBe('anthropic');
  });

  it('throws 503 when both providers fail', async () => {
    await build('openai');
    (mockOpenai.chat as jest.Mock).mockRejectedValue(new Error('OpenAI down'));
    (mockAnthropic.chat as jest.Mock).mockRejectedValue(
      new Error('Anthropic down'),
    );
    await expect(
      service.chat({ userId: 1, feature: 'chat', messages: MESSAGES }),
    ).rejects.toBeInstanceOf(HttpException);
  });

  describe('chatStream — token streaming (S19)', () => {
    it('calls provider.chatStream and forwards chunks via onChunk', async () => {
      await build('openai');
      const chunks: string[] = [];

      const res = await service.chatStream(
        { userId: 1, feature: 'chat', messages: MESSAGES },
        (chunk) => chunks.push(chunk),
      );

      expect(mockOpenai.chatStream).toHaveBeenCalled();
      expect(chunks).toEqual(['chunk1', 'chunk2']);
      expect(res.text).toBe('chunk1chunk2');
    });

    it('falls back to chat() when provider has no chatStream', async () => {
      await build('openai');
      delete (mockOpenai as any).chatStream;

      const res = await service.chatStream(
        { userId: 1, feature: 'chat', messages: MESSAGES },
        jest.fn(),
      );

      expect(mockOpenai.chat).toHaveBeenCalled();
      expect(res.text).toBe('hi');
    });
  });

  describe('injectPersonality — persona + memory wiring (S16)', () => {
    const PERSONA_BLOCK = 'You are Marcus. Direct, disciplined, no excuses.';
    const MEMORY_BLOCK =
      '[Memory Context]\n--- Recent interactions ---\nRan 5km yesterday.\n[End Memory Context]';

    let mockPersonalityService: { renderSystemPrompt: jest.Mock };
    let mockMemoryService: { buildContext: jest.Mock };

    const buildWithPersonality = async () => {
      mockOpenai = makeMockProvider('openai');
      mockAnthropic = makeMockProvider('anthropic');
      mockQuota = { checkAndEnforce: jest.fn().mockResolvedValue(undefined) };
      mockUserRepo = {
        findOne: jest.fn().mockResolvedValue({ id: 1, tier: UserTier.FREE }),
      };
      mockCallRepo = {
        create: jest.fn().mockReturnValue({}),
        save: jest.fn().mockResolvedValue({}),
      };
      mockDriftRepo = {
        create: jest.fn().mockReturnValue({}),
        save: jest.fn().mockResolvedValue({}),
      };
      mockPersonalityService = {
        renderSystemPrompt: jest.fn().mockReturnValue(PERSONA_BLOCK),
      };
      mockMemoryService = {
        buildContext: jest.fn().mockResolvedValue(MEMORY_BLOCK),
      };

      const module = await Test.createTestingModule({
        providers: [
          AiGatewayService,
          {
            provide: ConfigService,
            useValue: { get: jest.fn().mockReturnValue('openai') },
          },
          { provide: OpenAiProvider, useValue: mockOpenai },
          { provide: AnthropicProvider, useValue: mockAnthropic },
          { provide: QuotaService, useValue: mockQuota },
          { provide: getRepositoryToken(AiCall), useValue: mockCallRepo },
          { provide: getRepositoryToken(User), useValue: mockUserRepo },
          { provide: getRepositoryToken(DriftSample), useValue: mockDriftRepo },
          {
            provide: PersonalityService,
            useValue: mockPersonalityService,
          },
          { provide: MemoryService, useValue: mockMemoryService },
        ],
      }).compile();

      service = module.get(AiGatewayService);
    };

    it('replaces system messages with the YAML persona block when personalityId is set', async () => {
      await buildWithPersonality();

      const messagesWithSystem = [
        { role: 'system' as const, content: 'old-promptBlocks-prompt' },
        { role: 'user' as const, content: 'I need help with my goal.' },
      ];

      await service.chat({
        userId: 1,
        feature: 'chat',
        messages: messagesWithSystem,
        personalityId: 'marcus',
        event: 'chat',
      });

      const calledWith = (mockOpenai.chat as jest.Mock).mock.calls[0][0];
      const systemMsg = calledWith.messages.find(
        (m: { role: string }) => m.role === 'system',
      );

      expect(systemMsg?.content).toContain(PERSONA_BLOCK);
      expect(systemMsg?.content).not.toContain('old-promptBlocks-prompt');
    });

    it('prepends [Memory Context] block before the persona system prompt', async () => {
      await buildWithPersonality();

      await service.chat({
        userId: 1,
        feature: 'chat',
        messages: [{ role: 'user' as const, content: 'Check in with me.' }],
        personalityId: 'marcus',
        event: 'chat',
      });

      const calledWith = (mockOpenai.chat as jest.Mock).mock.calls[0][0];
      const systemMsg = calledWith.messages.find(
        (m: { role: string }) => m.role === 'system',
      );

      expect(systemMsg?.content).toContain('[Memory Context]');
      expect(systemMsg?.content).toContain(PERSONA_BLOCK);
      expect(systemMsg?.content.indexOf('[Memory Context]')).toBeLessThan(
        systemMsg?.content.indexOf(PERSONA_BLOCK),
      );
    });

    it('passes through messages unchanged when no personalityId is provided', async () => {
      await buildWithPersonality();

      const originalSystem = 'original system prompt';
      await service.chat({
        userId: 1,
        feature: 'chat',
        messages: [
          { role: 'system' as const, content: originalSystem },
          { role: 'user' as const, content: 'hello' },
        ],
      });

      const calledWith = (mockOpenai.chat as jest.Mock).mock.calls[0][0];
      const systemMsg = calledWith.messages.find(
        (m: { role: string }) => m.role === 'system',
      );
      expect(systemMsg?.content).toBe(originalSystem);
      expect(mockPersonalityService.renderSystemPrompt).not.toHaveBeenCalled();
    });

    it('preserves non-system messages after persona injection', async () => {
      await buildWithPersonality();

      await service.chat({
        userId: 1,
        feature: 'chat',
        messages: [
          { role: 'system' as const, content: 'old prompt' },
          { role: 'user' as const, content: 'Is this working?' },
          { role: 'assistant' as const, content: 'Yes.' },
        ],
        personalityId: 'marcus',
        event: 'chat',
      });

      const calledWith = (mockOpenai.chat as jest.Mock).mock.calls[0][0];
      const roles = calledWith.messages.map((m: { role: string }) => m.role);
      expect(roles).toEqual(['system', 'user', 'assistant']);
    });
  });
});
