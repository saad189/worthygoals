import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StatusPost, StatusReaction } from 'src/database/models';
import { AiGatewayService } from 'src/core/ai/gateway/ai-gateway.service';
import { StatusService } from '../status.service';
import { MediaService } from '../../media/media.service';
import { UsersService } from '../../users/users.service';

const USER_ID = 1;
const USER_SUB = 'cognito-sub-abc';

describe('StatusService', () => {
  let service: StatusService;
  let statusRepo: { create: jest.Mock; save: jest.Mock; find: jest.Mock };
  let reactionRepo: { create: jest.Mock; save: jest.Mock };
  let usersService: { findByAccountSub: jest.Mock };
  let gateway: { chat: jest.Mock };
  let mediaService: { getPresignedGetUrl: jest.Mock; markAttached: jest.Mock };

  beforeEach(async () => {
    statusRepo = {
      create: jest.fn((v) => v),
      save: jest.fn(async (v) => ({
        id: 'post-1',
        createdAt: new Date(),
        ...v,
      })),
      find: jest.fn(),
    };
    reactionRepo = {
      create: jest.fn((v) => v),
      save: jest.fn(async (v) => v),
    };
    usersService = {
      findByAccountSub: jest.fn().mockResolvedValue({ id: USER_ID }),
    };
    gateway = {
      chat: jest.fn(async (req) => ({
        text: `reply from ${req.personalityId}`,
        model: 'gpt-4o-mini',
        provider: 'openai',
        tokensIn: 1,
        tokensOut: 1,
      })),
    };

    mediaService = {
      getPresignedGetUrl: jest.fn().mockResolvedValue('https://signed/img.jpg'),
      markAttached: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusService,
        { provide: getRepositoryToken(StatusPost), useValue: statusRepo },
        { provide: getRepositoryToken(StatusReaction), useValue: reactionRepo },
        { provide: UsersService, useValue: usersService },
        { provide: AiGatewayService, useValue: gateway },
        { provide: MediaService, useValue: mediaService },
      ],
    }).compile();

    service = module.get<StatusService>(StatusService);
  });

  it('throws NotFoundException when user not found on create', async () => {
    usersService.findByAccountSub.mockResolvedValue(null);
    await expect(service.create(USER_SUB, { text: 'hello' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('fans out one in-voice reaction per personality, in roster order', async () => {
    const result = await service.create(USER_SUB, { text: 'did the work' });

    // marcus + lyra + goggs = three AI calls, each with the status.reaction event.
    expect(gateway.chat).toHaveBeenCalledTimes(3);
    for (const call of gateway.chat.mock.calls) {
      expect(call[0].event).toBe('status.reaction');
      expect(call[0].feature).toBe('status');
      expect(call[0].messages).toEqual([
        { role: 'user', content: 'did the work' },
      ]);
    }

    expect(result.reactions.map((r) => r.personalityId)).toEqual([
      'marcus',
      'lyra',
      'goggs',
    ]);
    expect(result.reactions.map((r) => r.text)).toEqual([
      'reply from marcus',
      'reply from lyra',
      'reply from goggs',
    ]);
    expect(reactionRepo.save).toHaveBeenCalledTimes(1);
  });

  it('falls back to a template line when a model call fails (post still succeeds)', async () => {
    gateway.chat.mockImplementation(async (req) => {
      if (req.personalityId === 'goggs') throw new Error('model down');
      return {
        text: `reply from ${req.personalityId}`,
        model: 'm',
        provider: 'p',
        tokensIn: 0,
        tokensOut: 0,
      };
    });

    const result = await service.create(USER_SUB, { text: 'mixed day' });

    expect(result.reactions).toHaveLength(3);
    const goggs = result.reactions.find((r) => r.personalityId === 'goggs');
    expect(goggs?.text).toBe('STAY HARD. NO EXCUSES.');
  });

  it('falls back when the model returns empty text', async () => {
    gateway.chat.mockResolvedValue({
      text: '   ',
      model: 'm',
      provider: 'p',
      tokensIn: 0,
      tokensOut: 0,
    });
    const result = await service.create(USER_SUB, { text: 'blank' });
    expect(result.reactions.every((r) => r.text.length > 0)).toBe(true);
  });

  it('lists a user feed newest-first with reactions re-ordered to the roster', async () => {
    statusRepo.find.mockResolvedValue([
      {
        id: 'p1',
        text: 'post one',
        createdAt: new Date(),
        reactions: [
          { personalityId: 'goggs', mentorName: 'Goggs', text: 'g' },
          { personalityId: 'marcus', mentorName: 'Marcus', text: 'm' },
          { personalityId: 'lyra', mentorName: 'Lyra', text: 'l' },
        ],
      },
    ]);
    const feed = await service.findAllForUser(USER_SUB);
    expect(feed).toHaveLength(1);
    expect(feed[0].reactions.map((r) => r.personalityId)).toEqual([
      'marcus',
      'lyra',
      'goggs',
    ]);
  });

  it('persists an attached photo and returns its presigned url (screen 12 chip)', async () => {
    const result = await service.create(USER_SUB, {
      text: 'ran with proof',
      mediaId: 'media-1',
    });

    expect(statusRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ mediaId: 'media-1' }),
    );
    expect(mediaService.markAttached).toHaveBeenCalledWith('media-1', USER_SUB);
    expect(mediaService.getPresignedGetUrl).toHaveBeenCalledWith('media-1');
    expect(result.imageUrl).toBe('https://signed/img.jpg');
  });

  it('returns a null imageUrl for photoless posts without touching media', async () => {
    const result = await service.create(USER_SUB, { text: 'plain' });
    expect(result.imageUrl).toBeNull();
    expect(mediaService.markAttached).not.toHaveBeenCalled();
    expect(mediaService.getPresignedGetUrl).not.toHaveBeenCalled();
  });
});
