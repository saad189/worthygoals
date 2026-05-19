import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationTables1768300000000 implements MigrationInterface {
  name = 'AddNotificationTables1768300000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE push_tokens (
        id          VARCHAR(36)   NOT NULL DEFAULT (UUID()),
        userId      INT           NOT NULL,
        token       VARCHAR(512)  NOT NULL,
        platform    VARCHAR(16)   NOT NULL DEFAULT 'expo',
        timezone    VARCHAR(64)   NULL,
        active      TINYINT(1)    NOT NULL DEFAULT 1,
        createdAt   DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt   DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY uq_push_tokens_user_token (userId, token(255)),
        INDEX idx_push_tokens_user_active (userId, active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE notification_logs (
        id          VARCHAR(36)   NOT NULL DEFAULT (UUID()),
        userId      INT           NOT NULL,
        kind        VARCHAR(32)   NOT NULL,
        sentDate    VARCHAR(10)   NOT NULL,
        token       VARCHAR(512)  NULL,
        status      VARCHAR(32)   NOT NULL DEFAULT 'sent',
        createdAt   DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        INDEX idx_notification_logs_user_date (userId, sentDate)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS notification_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS push_tokens`);
  }
}
