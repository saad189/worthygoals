import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMentorsForSeeder1767570000000 implements MigrationInterface {
  name = 'UpdateMentorsForSeeder1767570000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Expand enum to match current MentorCommunicationStyle values used in seed data.
    await queryRunner.query(
      "ALTER TABLE `mentors` MODIFY `communicationStyle` enum ('gentle','analytical','motivational','direct','straightforward','empathetic','calm','energetic','clear') NOT NULL DEFAULT 'gentle'",
    );

    await queryRunner.query(
      "ALTER TABLE `mentors` ADD `sortOrder` int NOT NULL DEFAULT '0'",
    );
    await queryRunner.query(
      'ALTER TABLE `mentors` ADD `modelConfig` json NULL',
    );
    await queryRunner.query(
      'CREATE INDEX `IDX_mentors_sortOrder` ON `mentors` (`sortOrder`)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX `IDX_mentors_sortOrder` ON `mentors`');
    await queryRunner.query('ALTER TABLE `mentors` DROP COLUMN `modelConfig`');
    await queryRunner.query('ALTER TABLE `mentors` DROP COLUMN `sortOrder`');

    // WARNING: This may fail if rows contain newer enum values.
    await queryRunner.query(
      "ALTER TABLE `mentors` MODIFY `communicationStyle` enum ('gentle','analytical','motivational','direct') NOT NULL DEFAULT 'gentle'",
    );
  }
}
