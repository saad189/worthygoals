import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPersonalityIdToMentors1768600000000
  implements MigrationInterface
{
  name = 'AddPersonalityIdToMentors1768600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`mentors\` ADD \`personality_id\` VARCHAR(64) NULL DEFAULT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_mentors_personality_id\` ON \`mentors\` (\`personality_id\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_mentors_personality_id\` ON \`mentors\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`mentors\` DROP COLUMN \`personality_id\``,
    );
  }
}
