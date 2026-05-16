import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTasksTables1767800000000 implements MigrationInterface {
  name = 'AddTasksTables1767800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`tasks\` (
        \`id\` varchar(36) NOT NULL,
        \`goalId\` varchar(36) NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`description\` text NULL,
        \`status\` enum('pending','completed','skipped') NOT NULL DEFAULT 'pending',
        \`dueDate\` datetime NULL,
        \`repeatFrequency\` enum('none','daily','weekly','monthly') NOT NULL DEFAULT 'none',
        \`occurrenceIndex\` int NOT NULL DEFAULT 0,
        \`parentTaskId\` varchar(36) NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX \`idx_tasks_goal_id\` (\`goalId\`),
        INDEX \`idx_tasks_goal_status\` (\`goalId\`, \`status\`),
        INDEX \`idx_tasks_due_date\` (\`dueDate\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `CREATE TABLE \`task_completions\` (
        \`id\` varchar(36) NOT NULL,
        \`taskId\` varchar(36) NOT NULL,
        \`moodScore\` tinyint NOT NULL,
        \`reflection\` text NULL,
        \`memoryPictureId\` varchar(36) NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX \`idx_completions_task_id\` (\`taskId\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `CREATE TABLE \`task_explanations\` (
        \`id\` varchar(36) NOT NULL,
        \`taskId\` varchar(36) NOT NULL,
        \`reason\` enum('couldnt','forgot','chose_not_to') NOT NULL,
        \`freeText\` text NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX \`idx_explanations_task_id\` (\`taskId\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `ALTER TABLE \`tasks\`
        ADD CONSTRAINT \`FK_tasks_goal\` FOREIGN KEY (\`goalId\`) REFERENCES \`goals\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE \`task_completions\`
        ADD CONSTRAINT \`FK_completions_task\` FOREIGN KEY (\`taskId\`) REFERENCES \`tasks\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE \`task_explanations\`
        ADD CONSTRAINT \`FK_explanations_task\` FOREIGN KEY (\`taskId\`) REFERENCES \`tasks\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`task_explanations\` DROP FOREIGN KEY \`FK_explanations_task\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`task_completions\` DROP FOREIGN KEY \`FK_completions_task\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tasks\` DROP FOREIGN KEY \`FK_tasks_goal\``,
    );
    await queryRunner.query(`DROP TABLE \`task_explanations\``);
    await queryRunner.query(`DROP TABLE \`task_completions\``);
    await queryRunner.query(`DROP TABLE \`tasks\``);
  }
}
