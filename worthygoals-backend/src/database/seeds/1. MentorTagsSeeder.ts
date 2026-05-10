import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { MentorTagEntity } from '../models/mentor_tags.entity';

/**
 * Tag list used for:
 * - filtering mentors
 * - search / discovery
 * - UI chips
 *
 * Slugs should be stable because they may be referenced in mentor seed data.
 */
const TAGS: Array<Pick<MentorTagEntity, 'slug' | 'label'>> = [
  { slug: 'faith', label: 'Faith' },
  { slug: 'quran', label: 'Qur’an' },
  { slug: 'dua', label: 'Duʿā & Dhikr' },
  { slug: 'habits', label: 'Habits' },
  { slug: 'motivation', label: 'Motivation' },
  { slug: 'mindset', label: 'Mindset' },
  { slug: 'mental-health', label: 'Mental Health' },
  { slug: 'sleep', label: 'Sleep' },
  { slug: 'productivity', label: 'Productivity' },
  { slug: 'study', label: 'Study' },
  { slug: 'career', label: 'Career' },
  { slug: 'finance', label: 'Finance' },
  { slug: 'fitness', label: 'Fitness' },
  { slug: 'relationships', label: 'Relationships' },
  { slug: 'parenting', label: 'Parenting' },
];

export default class MentorTagsSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repo = dataSource.getRepository(MentorTagEntity);

    for (const tag of TAGS) {
      const existing = await repo.findOne({ where: { slug: tag.slug } as any });

      if (!existing) {
        await repo.save(repo.create(tag as any));
        continue;
      }

      repo.merge(existing, tag as any);
      await repo.save(existing);
    }

    console.log('✅ Mentor tags seeded successfully!');
  }
}
