import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoalsTable1767700000000 implements MigrationInterface {
  name = 'AddGoalsTable1767700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`goals\` (
        \`id\` varchar(36) NOT NULL,
        \`userId\` int NOT NULL,
        \`mentorId\` int NULL,
        \`title\` varchar(255) NOT NULL,
        \`description\` text NULL,
        \`category\` enum('power','knowledge','spiritual') NOT NULL DEFAULT 'power',
        \`status\` enum('active','paused','completed','archived') NOT NULL DEFAULT 'active',
        \`costText\` text NULL,
        \`benefitText\` text NULL,
        \`failureText\` text NULL,
        \`deadline\` datetime NULL,
        \`repeatRule\` json NULL,
        \`stakeAmount\` decimal(10,2) NULL,
        \`imageUri\` varchar(512) NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX \`idx_goals_user_id\` (\`userId\`),
        INDEX \`idx_goals_user_status\` (\`userId\`, \`status\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `ALTER TABLE \`goals\`
        ADD CONSTRAINT \`FK_goals_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE \`goals\`
        ADD CONSTRAINT \`FK_goals_mentor\` FOREIGN KEY (\`mentorId\`) REFERENCES \`mentors\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`goals\` DROP FOREIGN KEY \`FK_goals_mentor\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`goals\` DROP FOREIGN KEY \`FK_goals_user\``,
    );
    await queryRunner.query(`DROP TABLE \`goals\``);
  }
}
