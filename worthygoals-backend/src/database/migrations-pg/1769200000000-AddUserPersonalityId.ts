import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * S51a · F2 — persist the onboarding-matched mentor server-side.
 * "Your mentor" was previously derived from the most-recent goal (unknown
 * before the first goal, silently changed by a later goal) or read from the
 * app's AsyncStorage (wiped on reinstall). This column makes the onboarding
 * choice authoritative and reinstall-proof. Nullable: existing users fall
 * back to the goal-derived mentor until they re-onboard.
 */
export class AddUserPersonalityId1769200000000 implements MigrationInterface {
  name = 'AddUserPersonalityId1769200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE users ADD COLUMN "personalityId" CHARACTER VARYING(64)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users DROP COLUMN "personalityId"`);
  }
}
