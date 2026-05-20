import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMentorReactionToCompletions1768500000000
  implements MigrationInterface
{
  name = 'AddMentorReactionToCompletions1768500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`task_completions\` ADD \`mentor_reaction\` TEXT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`task_completions\` DROP COLUMN \`mentor_reaction\``,
    );
  }
}
