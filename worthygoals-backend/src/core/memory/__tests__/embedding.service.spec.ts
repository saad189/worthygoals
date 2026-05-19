import { EmbeddingService } from '../embedding.service';

describe('EmbeddingService', () => {
  describe('cosineSimilarity', () => {
    it('returns 1 for identical vectors', () => {
      const v = [1, 0, 0];
      expect(EmbeddingService.cosineSimilarity(v, v)).toBeCloseTo(1);
    });

    it('returns 0 for orthogonal vectors', () => {
      expect(EmbeddingService.cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
    });

    it('returns -1 for opposite vectors', () => {
      expect(EmbeddingService.cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
    });

    it('returns 0 for zero vectors', () => {
      expect(EmbeddingService.cosineSimilarity([0, 0], [1, 1])).toBe(0);
    });

    it('handles multi-dimensional similarity', () => {
      const a = [3, 4, 0];
      const b = [3, 4, 0];
      expect(EmbeddingService.cosineSimilarity(a, b)).toBeCloseTo(1);
    });

    it('scores partially similar vectors between 0 and 1', () => {
      const a = [1, 1, 0];
      const b = [1, 0, 0];
      const score = EmbeddingService.cosineSimilarity(a, b);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });
  });
});
