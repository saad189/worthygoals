import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * S47 · gap closure — persist the onboarding tone preference server-side.
 * The forced-choice deck's result (soft | firm | intense) previously lived
 * only in the app's AsyncStorage, so no voiced surface (notifications,
 * personas) could scale to it. Nullable: existing users simply haven't
 * expressed one yet.
 */
export class AddUserTone1769000000000 implements MigrationInterface {
  name = 'AddUserTone1769000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE users ADD COLUMN tone CHARACTER VARYING(16)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users DROP COLUMN tone`);
  }
}
