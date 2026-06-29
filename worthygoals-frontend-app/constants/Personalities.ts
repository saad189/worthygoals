/**
 * Worthy Goals — Personality roster + tone matching (U4)
 * ─────────────────────────────────────────────────────────────
 * The three archetype personalities (Marcus / Lyra / Goggs) and the pure
 * logic that turns the onboarding forced-choice answers into a recommended
 * mentor + a saved tone preference (Q3 — "soft by default, but user-chosen").
 *
 * `slug === personalityId` in the AI runtime, so the slug is the stable
 * identity used everywhere downstream (chat, goals, theming). This local
 * roster is also the resilient fallback for the "your team" screen when the
 * backend mentor list hasn't been reseeded yet (U2 handoff).
 */

export type ToneKey = 'soft' | 'firm' | 'intense';
export type PersonalitySlug = 'lyra' | 'marcus' | 'goggs';

export interface Personality {
  slug: PersonalitySlug;
  name: string;
  /** One-line role label from the Hi-Fi spec (§1). */
  role: string;
  /** In-voice sample line shown before commitment. */
  sampleLine: string;
  /** The tone this personality embodies. */
  tone: ToneKey;
}

/** Ordered soft → firm → intense, matching the tone spectrum. */
export const PERSONALITIES: Personality[] = [
  {
    slug: 'lyra',
    name: 'Lyra',
    role: 'the steady one',
    tone: 'soft',
    sampleLine: "You're allowed to be tired. Just don't be done.",
  },
  {
    slug: 'marcus',
    name: 'Marcus',
    role: 'the lieutenant',
    tone: 'firm',
    sampleLine: "Same time tomorrow. Don't make me come looking.",
  },
  {
    slug: 'goggs',
    name: 'Goggs',
    role: 'the volume',
    tone: 'intense',
    sampleLine: "NO EXCUSES. WHO'S GOT NEXT?",
  },
];

export const SLUG_FOR_TONE: Record<ToneKey, PersonalitySlug> = {
  soft: 'lyra',
  firm: 'marcus',
  intense: 'goggs',
};

export function personaBySlug(slug?: string): Personality | undefined {
  return PERSONALITIES.find((p) => p.slug === slug);
}

/**
 * Resolve a personality from a free-form mentor display name (e.g. "Marcus",
 * "marcus", "Lyra · the steady one"). After the U2 roster reseed `name`
 * matches a roster persona, so chat / lists can recover the slug — and with it
 * the per-mentor accent — even when the data layer only carries a name.
 * Falls back to Marcus (the prototype default) so the accent is never blank.
 */
export function personaByName(name?: string): Personality {
  const needle = (name ?? '').trim().toLowerCase();
  return (
    PERSONALITIES.find((p) => needle.startsWith(p.name.toLowerCase())) ??
    personaBySlug('marcus')!
  );
}

/**
 * The forced-choice deck (Hi-Fi screen 02). Each card is a moment you slip;
 * the user picks the voice that lands — a soft framing or a harder one. Choosing
 * the hard side adds to the "intensity" score.
 */
export const TONE_TEST_CARDS: { soft: string; hard: string }[] = [
  { soft: "I'm disappointed in you.", hard: 'GET BACK UP. NOW.' },
  { soft: 'Rest. We go again tomorrow.', hard: 'NO DAYS OFF. MOVE.' },
  { soft: "It's okay to be tired.", hard: "TIRED ISN'T THE EXCUSE." },
  { soft: "Let's make it smaller.", hard: 'DO IT ANYWAY.' },
  { soft: 'I still believe in you.', hard: 'PROVE ME RIGHT.' },
  { soft: 'What got in the way?', hard: "WHAT'S THE EXCUSE?" },
];

/**
 * Map the forced-choice result to a tone.
 *  - skipped (no answers) → 'firm' (Marcus), the prototype's default selection.
 *  - mostly soft picks      → 'soft' (Lyra) — soft-by-default per Q3.
 *  - balanced               → 'firm' (Marcus).
 *  - mostly hard picks      → 'intense' (Goggs).
 *
 * @param hardCount how many cards the user answered on the hard side
 * @param answered  how many cards were answered (skip = 0)
 */
export function toneFromScore(hardCount: number, answered: number): ToneKey {
  if (answered <= 0) return 'firm';
  const ratio = hardCount / answered;
  if (ratio < 0.34) return 'soft';
  if (ratio < 0.67) return 'firm';
  return 'intense';
}

/** Recommended personality for a forced-choice result. */
export function recommendPersonality(hardCount: number, answered: number): Personality {
  const tone = toneFromScore(hardCount, answered);
  return personaBySlug(SLUG_FOR_TONE[tone])!;
}
