import {
  PERSONALITIES,
  TONE_TEST_CARDS,
  personaBySlug,
  recommendPersonality,
  SLUG_FOR_TONE,
  toneFromScore,
} from '@/constants/Personalities';

describe('Personalities — tone matching (U4)', () => {
  it('has the three WG personalities, slug === personalityId', () => {
    expect(PERSONALITIES.map((p) => p.slug).sort()).toEqual(['goggs', 'lyra', 'marcus']);
  });

  it('exposes a 6-card forced-choice deck', () => {
    expect(TONE_TEST_CARDS).toHaveLength(6);
    TONE_TEST_CARDS.forEach((c) => {
      expect(typeof c.soft).toBe('string');
      expect(typeof c.hard).toBe('string');
    });
  });

  describe('toneFromScore', () => {
    it('defaults to firm (Marcus) when the test is skipped', () => {
      expect(toneFromScore(0, 0)).toBe('firm');
    });

    it('maps mostly-soft answers to soft (Lyra)', () => {
      expect(toneFromScore(0, 6)).toBe('soft');
      expect(toneFromScore(1, 6)).toBe('soft');
    });

    it('maps a balanced split to firm (Marcus)', () => {
      expect(toneFromScore(3, 6)).toBe('firm');
    });

    it('maps mostly-hard answers to intense (Goggs)', () => {
      expect(toneFromScore(5, 6)).toBe('intense');
      expect(toneFromScore(6, 6)).toBe('intense');
    });
  });

  it('SLUG_FOR_TONE points each tone at the right personality', () => {
    expect(SLUG_FOR_TONE).toEqual({ soft: 'lyra', firm: 'marcus', intense: 'goggs' });
  });

  it('recommendPersonality returns a full persona for the matched tone', () => {
    expect(recommendPersonality(0, 6).slug).toBe('lyra');
    expect(recommendPersonality(6, 6).slug).toBe('goggs');
    expect(recommendPersonality(0, 0).slug).toBe('marcus');
  });

  it('personaBySlug resolves a known slug and ignores unknown ones', () => {
    expect(personaBySlug('lyra')?.name).toBe('Lyra');
    expect(personaBySlug('nobody')).toBeUndefined();
  });
});
