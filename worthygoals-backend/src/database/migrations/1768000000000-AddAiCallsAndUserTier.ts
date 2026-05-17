import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiCallsAndUserTier1768000000000 implements MigrationInterface {
  name = 'AddAiCallsAndUserTier1768000000000';

  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE \`ai_calls\` (
        \`id\`           int          NOT NULL AUTO_INCREMENT,
        \`userId\`        int          NOT NULL,
        \`feature\`       varchar(64)  NOT NULL,
        \`provider\`      varchar(32)  NOT NULL,
        \`model\`         varchar(64)  NOT NULL,
        \`inputTokens\`   int          NULL,
        \`outputTokens\`  int          NULL,
        \`costUsd\`       decimal(12,8) NULL,
        \`latencyMs\`     int          NULL,
        \`createdAt\`     datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_ai_calls_user_date\` (\`userId\`, \`createdAt\`)
      ) ENGINE=InnoDB
    `);

    await runner.query(`
      ALTER TABLE \`users\`
        ADD COLUMN \`tier\` varchar(16) NOT NULL DEFAULT 'free'
    `);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE \`users\` DROP COLUMN \`tier\``);
    await runner.query(`DROP TABLE \`ai_calls\``);
  }
}
