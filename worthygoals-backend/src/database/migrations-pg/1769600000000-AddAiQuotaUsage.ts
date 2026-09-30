import { MigrationInterface, QueryRunner } from 'typeorm';

/** Atomic per-day AI quota counter — see AiQuotaUsage (ECC-3 M11). */
export class AddAiQuotaUsage1769600000000 implements MigrationInterface {
  name = 'AddAiQuotaUsage1769600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE ai_quota_usage (
        "userId" INTEGER NOT NULL,
        day      DATE    NOT NULL,
        count    INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "PK_ai_quota_usage" PRIMARY KEY ("userId", day),
        CONSTRAINT fk_ai_quota_usage_user FOREIGN KEY ("userId")
          REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS ai_quota_usage`);
  }
}
