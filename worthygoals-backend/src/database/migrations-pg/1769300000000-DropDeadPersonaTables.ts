import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Retire three orphaned tables (S52 schema cleanup):
 *
 *  - `personalities`   — a thin lookup table whose repo was injected but never
 *                        queried; persona voice/routing lives in the YAML runtime
 *                        (`core/personalities/data/*.yaml`) and the catalog fields
 *                        live on `mentors` (slug === personalityId). Pure redundancy.
 *  - `mentor_tags` /   — the discipline-tag taxonomy from the pre-U2 roster,
 *    `mentor_to_tags`    retired in E-5. 0 rows, its seeder was never wired, and
 *                        the `mentors.tags` relation only ever produced empty output.
 *
 * `user_personalities` is intentionally NOT dropped here — it's still referenced
 * by the notification voicing path and its replacement (`users.personalityId`)
 * isn't merged yet.
 */
export class DropDeadPersonaTables1769300000000 implements MigrationInterface {
  name = 'DropDeadPersonaTables1769300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // join table first (owns FKs to mentors + mentor_tags)
    await queryRunner.query(`DROP TABLE IF EXISTS mentor_to_tags`);
    await queryRunner.query(`DROP TABLE IF EXISTS mentor_tags`);
    await queryRunner.query(`DROP TABLE IF EXISTS personalities`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate schema (structure + seed) mirroring 1768700000000-PostgresInit.
    await queryRunner.query(`
      CREATE TABLE mentor_tags (
        id          SERIAL PRIMARY KEY,
        slug        VARCHAR(64)   NOT NULL,
        label       VARCHAR(128)  NOT NULL,
        "createdAt" TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_mentor_tags_slug UNIQUE (slug)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE mentor_to_tags (
        "mentorId" INT NOT NULL,
        "tagId"    INT NOT NULL,
        PRIMARY KEY ("mentorId", "tagId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_mentor_to_tags_mentor_id ON mentor_to_tags ("mentorId")`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_mentor_to_tags_tag_id ON mentor_to_tags ("tagId")`,
    );
    await queryRunner.query(
      `ALTER TABLE mentor_to_tags ADD CONSTRAINT fk_mentor_to_tags_mentor FOREIGN KEY ("mentorId") REFERENCES mentors(id) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE mentor_to_tags ADD CONSTRAINT fk_mentor_to_tags_tag FOREIGN KEY ("tagId") REFERENCES mentor_tags(id) ON DELETE NO ACTION`,
    );

    await queryRunner.query(`
      CREATE TABLE personalities (
        id          VARCHAR(64)  NOT NULL PRIMARY KEY,
        name        VARCHAR(128) NOT NULL,
        description TEXT         NULL,
        "createdAt" TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      INSERT INTO personalities (id, name, description) VALUES
        ('marcus', 'Marcus Aurelius', 'Stoic philosopher-king. Brief, unflinching, redirects every moment to duty and growth.'),
        ('lyra',   'Lyra',           'Warm, emotionally perceptive coach. Celebrates effort, holds space for struggle, always optimistic.'),
        ('goggs',  'Goggs',          'Drill instructor. Blunt, zero tolerance for excuses, relentless but not cruel.')
    `);
  }
}
