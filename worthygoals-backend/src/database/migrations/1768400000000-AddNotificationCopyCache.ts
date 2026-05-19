import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationCopyCache1768400000000
  implements MigrationInterface
{
  name = 'AddNotificationCopyCache1768400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE notification_copy_cache (
        id            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
        personalityId VARCHAR(32)   NOT NULL,
        event         VARCHAR(48)   NOT NULL,
        day           VARCHAR(10)   NOT NULL,
        contextHash   VARCHAR(32)   NOT NULL,
        body          TEXT          NOT NULL,
        abVariant     VARCHAR(8)    NOT NULL DEFAULT 'A',
        createdAt     DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY uq_notif_copy_cache (personalityId, event, day, contextHash)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS notification_copy_cache`);
  }
}
