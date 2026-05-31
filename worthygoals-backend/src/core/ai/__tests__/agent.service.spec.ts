import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Mentor } from 'src/database/models';
import { Conversation } from 'src/database/models/conversation.entity';
import { Message } from 'src/database/models/message.entity';
import { ConversationSummary } from 'src/database/models/conversation-summary.entity';
import { MessageRole } from 'src/common/constants';
import { AgentService } from '../agent.service';
import { AiGatewayService } from '../gateway/ai-gateway.service';
import { PersonalityService } from 'src/core/personalities/personality.service';

const CONV_ID = 'conv-uuid';
const USER_ID = 42;
const MENTOR_ID = 7;

const makeMentor = (extra: Partial<Mentor> = {}) =>
  ({
    id: MENTOR_ID,
    slug: 'fitness-coach',
    name: 'Rafi',
    personalityId: 'goggs',
    isActive: true,
    promptBlocks: { systemPrompt: 'You are a fitness coach.' },
    tags: [],
    ...extra,
  }) as unknown as Mentor;

const makeConversation = () => ({
  id: CONV_ID,
  userId: USER_ID,
  mentorId: MENTOR_ID,
});

const makeMessage = (role: MessageRole, text: string) =>
  ({
    id: 'msg-uuid',
    conversationId: CONV_ID,
    role,
    text,
    content: null,
    archivedAt: null,
    createdAt: new Date('2026-01-01'),
  }) as unknown as Message;

describe('AgentService', () => {
  let service: AgentService;
  let mentorRepo: Record<string, jest.Mock>;
  let conversationRepo: Record<string, jest.Mock>;
  let messageRepo: Record<string, jest.Mock>;
  let summaryRepo: Record<string, jest.Mock>;
  let gateway: { chat: jest.Mock };
  let personalityService: { hasPersonality: jest.Mock };

  beforeEach(async () => {
    mentorRepo = {
      findOne: jest.fn().mockResolvedValue(makeMentor()),
      find: jest.fn().mockResolvedValue([makeMentor()]),
    };

    conversationRepo = {
      findOne: jest.fn().mockResolvedValue(makeConversation()),
    };

    messageRepo = {
      find: jest
        .fn()
        .mockResolvedValue([makeMessage(MessageRole.USER, 'hello')]),
    };

    summaryRepo = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    gateway = {
      chat: jest.fn().mockResolvedValue({
        text: 'Great work!',
        model: 'gpt-4o-mini',
        provider: 'openai',
        tokensIn: 20,
        tokensOut: 10,
      }),
    };

    personalityService = {
      hasPersonality: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentService,
        { provide: getRepositoryToken(Mentor), useValue: mentorRepo },
        {
          provide: getRepositoryToken(Conversation),
          useValue: conversationRepo,
        },
        { provide: getRepositoryToken(Message), useValue: messageRepo },
        {
          provide: getRepositoryToken(ConversationSummary),
          useValue: summaryRepo,
        },
        { provide: AiGatewayService, useValue: gateway },
        { provide: PersonalityService, useValue: personalityService },
      ],
    }).compile();

    service = module.get<AgentService>(AgentService);
  });

  describe('generateMentorReply', () => {
    it('returns personalityId from the mentor record', async () => {
      const result = await service.generateMentorReply({
        conversationId: CONV_ID,
        userId: USER_ID,
      });

      expect(result.personalityId).toBe('goggs');
    });

    it('returns null personalityId when mentor has no mapping', async () => {
      mentorRepo.findOne.mockResolvedValue(makeMentor({ personalityId: null }));

      const result = await service.generateMentorReply({
        conversationId: CONV_ID,
        userId: USER_ID,
      });

      expect(result.personalityId).toBeNull();
    });

    it('returns AI reply text, model, and token counts', async () => {
      const result = await service.generateMentorReply({
        conversationId: CONV_ID,
        userId: USER_ID,
      });

      expect(result.replyText).toBe('Great work!');
      expect(result.model).toBe('gpt-4o-mini');
      expect(result.tokensIn).toBe(20);
      expect(result.tokensOut).toBe(10);
    });

    it('throws NotFoundException when conversation not found', async () => {
      conversationRepo.findOne.mockResolvedValue(null);

      await expect(
        service.generateMentorReply({
          conversationId: CONV_ID,
          userId: USER_ID,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when userId does not match conversation', async () => {
      conversationRepo.findOne.mockResolvedValue({
        ...makeConversation(),
        userId: 999,
      });

      await expect(
        service.generateMentorReply({
          conversationId: CONV_ID,
          userId: USER_ID,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('passes personalityId and event:chat to gateway when mentor has a mapping', async () => {
      await service.generateMentorReply({
        conversationId: CONV_ID,
        userId: USER_ID,
      });

      expect(gateway.chat).toHaveBeenCalledWith(
        expect.objectContaining({ personalityId: 'goggs', event: 'chat' }),
      );
    });

    it('passes undefined personalityId to gateway when mentor has no mapping', async () => {
      mentorRepo.findOne.mockResolvedValue(makeMentor({ personalityId: null }));

      await service.generateMentorReply({
        conversationId: CONV_ID,
        userId: USER_ID,
      });

      expect(gateway.chat).toHaveBeenCalledWith(
        expect.objectContaining({ personalityId: undefined, event: 'chat' }),
      );
    });
  });

  describe('validatePersonalityMappings', () => {
    it('reports valid mentors that have a recognised personalityId', async () => {
      mentorRepo.find.mockResolvedValue([
        makeMentor({ personalityId: 'goggs' }),
      ]);
      personalityService.hasPersonality.mockReturnValue(true);

      const result = await service.validatePersonalityMappings();

      expect(result.valid).toContain('fitness-coach');
      expect(result.missing).toHaveLength(0);
      expect(result.invalid).toHaveLength(0);
    });

    it('reports mentors missing a personalityId', async () => {
      mentorRepo.find.mockResolvedValue([makeMentor({ personalityId: null })]);

      const result = await service.validatePersonalityMappings();

      expect(result.missing).toContain('fitness-coach');
      expect(result.valid).toHaveLength(0);
    });

    it('reports mentors with an unrecognised personalityId', async () => {
      mentorRepo.find.mockResolvedValue([
        makeMentor({ personalityId: 'unknown-persona' }),
      ]);
      personalityService.hasPersonality.mockReturnValue(false);

      const result = await service.validatePersonalityMappings();

      expect(result.invalid).toContain('fitness-coach');
      expect(result.valid).toHaveLength(0);
    });

    it('handles multiple mentors across all three buckets', async () => {
      mentorRepo.find.mockResolvedValue([
        makeMentor({ slug: 'coach-a', personalityId: 'marcus' }),
        makeMentor({ slug: 'coach-b', personalityId: null }),
        makeMentor({ slug: 'coach-c', personalityId: 'ghost' }),
      ]);
      personalityService.hasPersonality.mockImplementation(
        (id: string) => id === 'marcus',
      );

      const result = await service.validatePersonalityMappings();

      expect(result.valid).toEqual(['coach-a']);
      expect(result.missing).toEqual(['coach-b']);
      expect(result.invalid).toEqual(['coach-c']);
    });
  });
});
