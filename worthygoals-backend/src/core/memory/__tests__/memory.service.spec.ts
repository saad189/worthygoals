import { MemoryService } from '../memory.service';
import { EmbeddingService } from '../embedding.service';

const mockEmbeddingRepo = {
  create: jest.fn((data) => data),
  save: jest.fn(async (data) => data),
  find: jest.fn(async () => []),
  findOne: jest.fn(async () => null),
  createQueryBuilder: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(async () => []),
  })),
};

const mockDigestRepo = {
  create: jest.fn((data) => data),
  save: jest.fn(async (data) => data),
  findOne: jest.fn(async () => null),
};

const mockEmbeddingService = {
  available: true,
  embed: jest.fn(async () => [0.1, 0.2, 0.3]),
  search: jest.fn(async () => []),
} as unknown as EmbeddingService;

function makeService() {
  return new MemoryService(
    mockEmbeddingService,
    mockEmbeddingRepo as any,
    mockDigestRepo as any,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MemoryService', () => {
  describe('indexCompletion', () => {
    it('calls embed and saves row for non-empty text', async () => {
      const svc = makeService();
      svc.indexCompletion(1, 'task-uuid', 'Ran 5k today', 'marcus');
      await new Promise((r) => setTimeout(r, 20));
      expect(mockEmbeddingService.embed).toHaveBeenCalledWith('Ran 5k today');
      expect(mockEmbeddingRepo.save).toHaveBeenCalled();
    });

    it('skips embedding for empty text', async () => {
      const svc = makeService();
      svc.indexCompletion(1, 'task-uuid', '  ', 'marcus');
      await new Promise((r) => setTimeout(r, 20));
      expect(mockEmbeddingService.embed).not.toHaveBeenCalled();
    });
  });

  describe('buildContext', () => {
    it('returns empty string when repos have no data', async () => {
      const svc = makeService();
      mockEmbeddingRepo.find.mockResolvedValue([]);
      mockDigestRepo.findOne.mockResolvedValue(null);
      mockEmbeddingService.search = jest.fn(async () => []);

      const ctx = await svc.buildContext(1, 'marcus', 'tough run today');
      expect(ctx).toBe('');
    });

    it('includes recent interactions when they exist', async () => {
      const svc = makeService();
      mockEmbeddingRepo.find.mockResolvedValue([
        { embeddingText: 'Completed morning run', createdAt: new Date() },
      ]);
      mockDigestRepo.findOne.mockResolvedValue(null);
      mockEmbeddingService.search = jest.fn(async () => []);

      const ctx = await svc.buildContext(1, 'marcus', 'how am I doing?');
      expect(ctx).toContain('Memory Context');
      expect(ctx).toContain('Completed morning run');
    });

    it('includes digest when available', async () => {
      const svc = makeService();
      mockEmbeddingRepo.find.mockResolvedValue([]);
      mockDigestRepo.findOne.mockResolvedValue({
        digestText: 'User is focused on marathon training',
        createdAt: new Date(),
      });
      mockEmbeddingService.search = jest.fn(async () => []);

      const ctx = await svc.buildContext(1, 'marcus', 'training update');
      expect(ctx).toContain('marathon training');
    });

    it('includes RAG snippets above similarity threshold', async () => {
      const svc = makeService();
      mockEmbeddingRepo.find.mockResolvedValue([]);
      mockDigestRepo.findOne.mockResolvedValue(null);
      mockEmbeddingService.search = jest.fn(async () => [
        { text: 'Injury from two weeks ago', score: 0.88 },
        { text: 'Irrelevant low-score entry', score: 0.5 },
      ]);

      const ctx = await svc.buildContext(1, 'marcus', 'my knee hurts again');
      expect(ctx).toContain('Injury from two weeks ago');
      expect(ctx).not.toContain('Irrelevant low-score entry');
    });
  });

  describe('saveDigest', () => {
    it('saves a digest row with correct fields', async () => {
      const svc = makeService();
      const start = new Date('2026-01-01');
      const end = new Date('2026-01-31');
      await svc.saveDigest(1, 'marcus', 'User is consistent', start, end);
      expect(mockDigestRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          personalityId: 'marcus',
          digestText: 'User is consistent',
          periodStart: '2026-01-01',
          periodEnd: '2026-01-31',
        }),
      );
    });
  });
});
