import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Flow ⑤ · Status / polyphonic reactions (S42 · P-B).
 * A status post fans out to one in-voice reaction per personality.
 *
 * uuid PKs carry DEFAULT gen_random_uuid() — TypeORM's
 * @PrimaryGeneratedColumn('uuid') inserts id=DEFAULT and relies on the column
 * default (the same fix the sprint-31 migration applied to the chat tables).
 */
export class AddStatusTables1768900000000 implements MigrationInterface {
  name = 'AddStatusTables1768900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE status_posts (
        id          UUID         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"    INTEGER      NOT NULL,
        text        TEXT         NOT NULL,
        "createdAt" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_status_posts_user FOREIGN KEY ("userId")
          REFERENCES users (id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_status_posts_user_created_at ON status_posts ("userId", "createdAt")`,
    );

    await queryRunner.query(`
      CREATE TABLE status_reactions (
        id               UUID         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
        "statusId"       UUID         NOT NULL,
        "personalityId"  VARCHAR(64)  NOT NULL,
        "mentorName"     VARCHAR(64)  NOT NULL,
        text             TEXT         NOT NULL,
        "createdAt"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_status_reactions_status FOREIGN KEY ("statusId")
          REFERENCES status_posts (id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_status_reactions_status_id ON status_reactions ("statusId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS status_reactions`);
    await queryRunner.query(`DROP TABLE IF EXISTS status_posts`);
  }
}
