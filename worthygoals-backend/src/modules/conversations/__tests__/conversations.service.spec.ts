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

// QA-40: the messages list's unread dot was hard-coded to "read".
describe('ConversationsService.markRead', () => {
  const conversationRepo = { update: jest.fn() };
  const service = new ConversationsService(
    conversationRepo as any,
    {} as any,
    { findByAccountSub: jest.fn().mockResolvedValue({ id: 7 }) } as any,
  );

  it("stamps the thread read, scoped to the caller's own conversations", async () => {
    conversationRepo.update.mockResolvedValue({ affected: 1 });
    await service.markRead({ id: 'c1', sub: 's' });
    const [where, set] = conversationRepo.update.mock.calls[0];
    expect(where).toEqual({ id: 'c1', userId: 7 });
    expect(set.lastReadAt).toBeInstanceOf(Date);
  });

  it("404s on a conversation that isn't the caller's", async () => {
    conversationRepo.update.mockResolvedValue({ affected: 0 });
    await expect(
      service.markRead({ id: 'someone-elses', sub: 's' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
