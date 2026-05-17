import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMediaTable1767900000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE media (
        id          VARCHAR(36)  NOT NULL PRIMARY KEY,
        userId      INT          NOT NULL,
        s3Key       VARCHAR(512) NOT NULL,
        contentType VARCHAR(255) NULL,
        width       INT          NULL,
        height      INT          NULL,
        isAttached  TINYINT(1)   NOT NULL DEFAULT 0,
        uploadedAt  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX idx_media_user_id (userId),
        CONSTRAINT fk_media_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE media;`);
  }
}
