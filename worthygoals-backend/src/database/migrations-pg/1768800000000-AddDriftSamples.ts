import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDriftSamples1768800000000 implements MigrationInterface {
  name = 'AddDriftSamples1768800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE drift_samples (
        id             SERIAL PRIMARY KEY,
        personality_id VARCHAR(64)  NULL,
        event          VARCHAR(64)  NULL,
        user_message   TEXT         NULL,
        output         TEXT         NOT NULL,
        model          VARCHAR(64)  NULL,
        created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_drift_samples_created_at ON drift_samples (created_at)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS drift_samples`);
  }
}
