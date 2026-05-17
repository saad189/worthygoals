import { Test } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiCall } from 'src/database/models/ai-call.entity';
import { User } from 'src/database/models/user.entity';
import { UserTier } from 'src/common/constants/enums';
import { AiGatewayService } from '../gateway/ai-gateway.service';
import { OpenAiProvider } from '../gateway/openai.provider';
import { AnthropicProvider } from '../gateway/anthropic.provider';
import { QuotaExceededException, QuotaService } from '../quota/quota.service';

const MESSAGES = [{ role: 'user' as const, content: 'hello' }];
const fakeResponse = { text: 'hi', model: 'gpt-4o-mini', tokensIn: 10, tokensOut: 5 };

const makeMockProvider = (name: string, available = true, impl?: any) => ({
  name,
  available,
  defaultModel: name === 'openai' ? 'gpt-4o-mini' : 'claude-3-5-haiku-20241022',
  chat: impl ?? jest.fn().mockResolvedValue(fakeResponse),
});

describe('AiGatewayService', () => {
  let service: AiGatewayService;
  let mockOpenai: ReturnType<typeof makeMockProvider>;
  let mockAnthropic: ReturnType<typeof makeMockProvider>;
  let mockQuota: Partial<QuotaService>;
  let mockUserRepo: any;
  let mockCallRepo: any;

  const build = async (activeProvider = 'openai') => {
    mockOpenai = makeMockProvider('openai');
    mockAnthropic = makeMockProvider('anthropic', true, jest.fn().mockResolvedValue({
      ...fakeResponse, model: 'claude-3-5-haiku-20241022', provider: 'anthropic',
    }));
    mockQuota = { checkAndEnforce: jest.fn().mockResolvedValue(undefined) };
    mockUserRepo = { findOne: jest.fn().mockResolvedValue({ id: 1, tier: UserTier.FREE }) };
    mockCallRepo = { create: jest.fn().mockReturnValue({}), save: jest.fn().mockResolvedValue({}) };

    const module = await Test.createTestingModule({
      providers: [
        AiGatewayService,
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(activeProvider) } },
        { provide: OpenAiProvider, useValue: mockOpenai },
        { provide: AnthropicProvider, useValue: mockAnthropic },
        { provide: QuotaService, useValue: mockQuota },
        { provide: getRepositoryToken(AiCall), useValue: mockCallRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get(AiGatewayService);
  };

  it('routes to OpenAI by default', async () => {
    await build('openai');
    const res = await service.chat({ userId: 1, feature: 'chat', messages: MESSAGES });
    expect(mockOpenai.chat).toHaveBeenCalled();
    expect(res.text).toBe('hi');
    expect(res.provider).toBe('openai');
  });

  it('routes to Anthropic when AI_ACTIVE_PROVIDER=anthropic', async () => {
    await build('anthropic');
    const res = await service.chat({ userId: 1, feature: 'chat', messages: MESSAGES });
    expect(mockAnthropic.chat).toHaveBeenCalled();
    expect(res.provider).toBe('anthropic');
  });

  it('logs the ai_call to the database', async () => {
    await build();
    await service.chat({ userId: 1, feature: 'chat', messages: MESSAGES });
    expect(mockCallRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 1, feature: 'chat', provider: 'openai' }),
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
    (mockOpenai.chat as jest.Mock).mockRejectedValue(new Error('OpenAI timeout'));
    const res = await service.chat({ userId: 1, feature: 'chat', messages: MESSAGES });
    expect(res.provider).toBe('anthropic');
  });

  it('throws 503 when both providers fail', async () => {
    await build('openai');
    (mockOpenai.chat as jest.Mock).mockRejectedValue(new Error('OpenAI down'));
    (mockAnthropic.chat as jest.Mock).mockRejectedValue(new Error('Anthropic down'));
    await expect(
      service.chat({ userId: 1, feature: 'chat', messages: MESSAGES }),
    ).rejects.toBeInstanceOf(HttpException);
  });
});
