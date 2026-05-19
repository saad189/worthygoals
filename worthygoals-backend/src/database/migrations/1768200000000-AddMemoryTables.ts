import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMemoryTables1768200000000 implements MigrationInterface {
  name = 'AddMemoryTables1768200000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE memory_embeddings (
        id          VARCHAR(36)   NOT NULL DEFAULT (UUID()),
        userId      INT           NOT NULL,
        sourceType  ENUM('completion','explanation','message') NOT NULL,
        sourceId    VARCHAR(36)   NULL,
        embeddingText TEXT        NOT NULL,
        embeddingJson LONGTEXT    NOT NULL,
        personalityId VARCHAR(64) NULL,
        createdAt   DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        INDEX idx_memory_embeddings_user_personality_created (userId, personalityId, createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE memory_digests (
        id            VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        userId        INT          NOT NULL,
        personalityId VARCHAR(64)  NOT NULL,
        digestText    TEXT         NOT NULL,
        periodStart   DATE         NOT NULL,
        periodEnd     DATE         NOT NULL,
        createdAt     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        INDEX idx_memory_digests_user_personality_created (userId, personalityId, createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS memory_digests`);
    await queryRunner.query(`DROP TABLE IF EXISTS memory_embeddings`);
  }
}
