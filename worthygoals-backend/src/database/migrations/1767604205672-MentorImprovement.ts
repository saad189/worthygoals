import { MigrationInterface, QueryRunner } from 'typeorm';

export class MentorImprovement1767604205672 implements MigrationInterface {
  name = 'MentorImprovement1767604205672';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasSortOrder = await queryRunner.hasColumn('mentors', 'sortOrder');
    if (!hasSortOrder) {
      await queryRunner.query(
        `ALTER TABLE \`mentors\` ADD \`sortOrder\` int NOT NULL DEFAULT '0'`,
      );
    }

    const hasModelConfig = await queryRunner.hasColumn(
      'mentors',
      'modelConfig',
    );
    if (!hasModelConfig) {
      await queryRunner.query(
        `ALTER TABLE \`mentors\` ADD \`modelConfig\` json NULL`,
      );
    }

    // Idempotent: re-applying the same enum definition is safe.
    await queryRunner.query(
      `ALTER TABLE \`mentors\` CHANGE \`communicationStyle\` \`communicationStyle\` enum ('gentle', 'analytical', 'motivational', 'direct', 'straightforward', 'empathetic', 'calm', 'energetic', 'clear') NOT NULL DEFAULT 'gentle'`,
    );

    // Avoid creating a redundant index if an index on sortOrder already exists.
    const existingIndex = await queryRunner.query(
      `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mentors' AND COLUMN_NAME = 'sortOrder' AND INDEX_NAME <> 'PRIMARY' LIMIT 1`,
    );
    if (!existingIndex?.length) {
      await queryRunner.query(
        `CREATE INDEX \`IDX_1d74e5008c837e06cd4da88d28\` ON \`mentors\` (\`sortOrder\`)`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const idx = await queryRunner.query(
      `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mentors' AND INDEX_NAME = 'IDX_1d74e5008c837e06cd4da88d28' LIMIT 1`,
    );
    if (idx?.length) {
      await queryRunner.query(
        `DROP INDEX \`IDX_1d74e5008c837e06cd4da88d28\` ON \`mentors\``,
      );
    }

    await queryRunner.query(
      `ALTER TABLE \`mentors\` CHANGE \`communicationStyle\` \`communicationStyle\` enum ('gentle', 'analytical', 'motivational', 'direct') NOT NULL DEFAULT 'gentle'`,
    );

    const hasModelConfig = await queryRunner.hasColumn(
      'mentors',
      'modelConfig',
    );
    if (hasModelConfig) {
      await queryRunner.query(
        `ALTER TABLE \`mentors\` DROP COLUMN \`modelConfig\``,
      );
    }

    const hasSortOrder = await queryRunner.hasColumn('mentors', 'sortOrder');
    if (hasSortOrder) {
      await queryRunner.query(
        `ALTER TABLE \`mentors\` DROP COLUMN \`sortOrder\``,
      );
    }
  }
}
