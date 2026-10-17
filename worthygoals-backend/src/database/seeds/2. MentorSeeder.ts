import { DataSource, Not, In } from 'typeorm';
import { Seeder } from 'typeorm-extension';

import { Mentor } from '../models/mentor.entity';
import {
  MentorCommunicationStyle,
  MentorResponseLength,
  MentorVisibility,
  MemoryScope,
} from 'src/common/constants';

/**
 * Helper: keep seed objects compatible with your current DB schema.
 * This makes the seeder resilient if you add/remove columns later.
 */
function pickColumns<T extends object>(
  repo: { metadata: any },
  obj: Partial<T>,
): Partial<T> {
  const cols = new Set<string>(
    repo.metadata.columns.map((c: any) => c.propertyName),
  );
  const picked: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (cols.has(k)) picked[k] = v;
  }
  return picked as Partial<T>;
}

/**
 * Worthy Goals roster (Q1 · UI re-arch U2).
 *
 * The roster IS the three archetype personalities — Marcus, Lyra, Goggs — the
 * same characters the YAML personality runtime drives (`src/core/personalities/
 * data/*.yaml`). The discipline-specialist roster (Imam Hakeem, Noor, Rafi,
 * Atlas, Sage, Nova…) is retired by `run()` below (see retirement step).
 *
 * This seeds only what the app shows (name, title, descriptions, order). Voice
 * and routing live solely in the YAML persona, injected by the gateway.
 * `slug === personalityId` so the gateway, memory and evals all line up.
 */

/**
 * Clears the voice columns on re-seed so a stale DB copy of a prompt can't be
 * mistaken for the live one. promptBlocks is NOT NULL, hence an empty prompt
 * rather than null.
 */
const VOICE_LIVES_IN_YAML = {
  promptBlocks: { systemPrompt: '' },
  modelConfig: null,
  personalityTraits: null,
} as unknown as Partial<Mentor>;

const MENTOR_DATA: Array<Partial<Mentor>> = [
  {
    slug: 'marcus',
    personalityId: 'marcus',
    name: 'Marcus',
    title: 'The Stoic',
    shortDescription:
      'Brief, unflinching. Redirects every moment back to the work.',
    longDescription:
      'A stoic mentor in the tradition of Marcus Aurelius. He never flatters and never excuses. Every reply is short, measured, and ends by pointing you back toward the next action. Choose him when you want discipline over comfort.',
    visibility: MentorVisibility.PUBLIC,
    communicationStyle: MentorCommunicationStyle.DIRECT,
    responseLength: MentorResponseLength.SHORT,
    sortOrder: 10,
    memoryPolicy: {
      canRememberUser: true,
      scope: MemoryScope.SHORT_TERM,
      retentionDays: 30,
    },
    ...VOICE_LIVES_IN_YAML,
  },

  {
    slug: 'lyra',
    personalityId: 'lyra',
    name: 'Lyra',
    title: 'The Encourager',
    shortDescription:
      'Warm and perceptive. Celebrates effort, holds space for the hard days.',
    longDescription:
      'An emotionally intelligent mentor who celebrates effort and holds space for struggle without ever turning into empty hype. She finds something real to affirm and stays curious about how you actually feel. Choose her when you respond to warmth over pressure.',
    visibility: MentorVisibility.PUBLIC,
    communicationStyle: MentorCommunicationStyle.EMPATHETIC,
    responseLength: MentorResponseLength.MEDIUM,
    sortOrder: 20,
    memoryPolicy: {
      canRememberUser: true,
      scope: MemoryScope.SHORT_TERM,
      retentionDays: 30,
    },
    ...VOICE_LIVES_IN_YAML,
  },

  {
    slug: 'goggs',
    personalityId: 'goggs',
    name: 'Goggs',
    title: 'The Drill Instructor',
    shortDescription:
      'Blunt, zero tolerance for excuses. Pushes hard, means well.',
    longDescription:
      'A drill-instructor mentor: terse, relentless, and entirely without fluff — but never cruel. He gives orders and asks hard questions; he never cheers. Choose him when you need someone who will not let you negotiate with yourself.',
    visibility: MentorVisibility.PUBLIC,
    communicationStyle: MentorCommunicationStyle.STRAIGHTFORWARD,
    responseLength: MentorResponseLength.SHORT,
    sortOrder: 30,
    memoryPolicy: {
      canRememberUser: true,
      scope: MemoryScope.SHORT_TERM,
      retentionDays: 30,
    },
    ...VOICE_LIVES_IN_YAML,
  },
];

/** Slugs that make up the live Worthy Goals roster. */
const ACTIVE_SLUGS = MENTOR_DATA.map((m) => m.slug);

export default class MentorSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const mentorRepository = dataSource.getRepository(Mentor);

    for (const seed of MENTOR_DATA) {
      const existing = seed.slug
        ? await mentorRepository.findOne({ where: { slug: seed.slug } as any })
        : null;

      const picked = pickColumns<Mentor>(mentorRepository, seed);

      if (!existing) {
        await mentorRepository.save(mentorRepository.create(picked));
        continue;
      }

      mentorRepository.merge(existing, picked);
      await mentorRepository.save(existing);
    }

    // Retire any legacy discipline-specialist mentors (Imam Hakeem, Noor, Rafi,
    // Atlas, Sage, Nova…). They may still be referenced by existing
    // conversations/goals via FK, so we soft-retire rather than hard-delete:
    // hidden from the roster (findAll filters on isActive + PUBLIC) but still
    // resolvable by id for historical records.
    const retired = await mentorRepository.update(
      { slug: Not(In(ACTIVE_SLUGS)) },
      { isActive: false, visibility: MentorVisibility.PRIVATE },
    );

    console.log(
      `✅ Mentors seeded: ${ACTIVE_SLUGS.join(', ')} · retired ${
        retired.affected ?? 0
      } legacy mentor(s)`,
    );
  }
}
