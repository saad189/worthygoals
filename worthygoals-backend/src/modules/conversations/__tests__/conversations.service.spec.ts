import { NotFoundException } from '@nestjs/common';
import { ConversationsService } from '../conversations.service';

describe('ConversationsService.create', () => {
  const mentorRepo = { exist: jest.fn() };
  const conversationRepo = {
    manager: { getRepository: () => mentorRepo },
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((x) => x),
    save: jest.fn((x) => Promise.resolve({ id: 'c1', ...x })),
  };
  const usersService = {
    findByAccountSub: jest.fn().mockResolvedValue({ id: 7 }),
  };
  const service = new ConversationsService(
    conversationRepo as any,
    {} as any,
    usersService as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('refuses a mentor that is not in the public, active catalogue', async () => {
    mentorRepo.exist.mockResolvedValue(false);
    await expect(
      service.create({ sub: 's', dto: { mentorId: 99 } as any }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(conversationRepo.save).not.toHaveBeenCalled();
  });

  it('creates a conversation with a listed mentor', async () => {
    mentorRepo.exist.mockResolvedValue(true);
    await expect(
      service.create({ sub: 's', dto: { mentorId: 1 } as any }),
    ).resolves.toMatchObject({ userId: 7, mentorId: 1 });
  });

  // The lookup used to be the only guard, so a double tap made two threads.
  it('returns the winning thread when a concurrent create hits the unique index', async () => {
    mentorRepo.exist.mockResolvedValue(true);
    const winner = { id: 'c-first', userId: 7, mentorId: 1 };
    conversationRepo.findOne
      .mockResolvedValueOnce(null) // the fast-path lookup missed
      .mockResolvedValueOnce(winner); // re-read after losing the insert
    conversationRepo.save.mockRejectedValueOnce(
      Object.assign(new Error('duplicate key'), { code: '23505' }),
    );

    await expect(
      service.create({ sub: 's', dto: { mentorId: 1 } as any }),
    ).resolves.toBe(winner);
  });
});
