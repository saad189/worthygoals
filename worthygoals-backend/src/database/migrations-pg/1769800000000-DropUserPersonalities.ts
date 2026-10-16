import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drop `user_personalities` (tracker C4).
 *
 * Its only writer, setUserPersonality, never had a caller, so the table was
 * always empty — and its one reader (notification voicing) was repointed at
 * users.personalityId in C3, which is what made every push ship generic copy
 * until then. The code referencing the entity is removed in the same change.
 *
 * What is lost is persona-switch history (one row per user per personality
 * with an activatedAt), which nothing ever recorded. down() recreates the table
 * exactly as PostgresInit + EccMediumLow shaped it, empty.
 *
 * Ordering: on a multi-replica rollout, an instance still running the old code
 * would 500 on GDPR export after this runs. Boot migrations are serialised
 * under an advisory lock (E5), but old replicas can still be serving; roll the
 * code out before (or with) this migration, never after.
 */
export class DropUserPersonalities1769800000000 implements MigrationInterface {
  name = 'DropUserPersonalities1769800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS user_personalities`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE user_personalities (
        id                  SERIAL      PRIMARY KEY,
        "userId"            INT         NOT NULL,
        "personalityId"     VARCHAR(64) NOT NULL,
        "relationshipState" JSONB       NOT NULL DEFAULT '{}',
        "escalationSlope"   FLOAT       NOT NULL DEFAULT 0,
        "activatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_user_personalities_user FOREIGN KEY ("userId")
          REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_user_personalities_user_id ON user_personalities ("userId")`,
    );
  }
}
