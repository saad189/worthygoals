import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * S47 · gap closure — the compose screen's 📷 photo chip (Hi-Fi screen 12).
 * A status post may carry one photo, uploaded through the existing media
 * presign path; the feed resolves it to a presigned GET url on read.
 */
export class AddStatusPostMedia1769100000000 implements MigrationInterface {
  name = 'AddStatusPostMedia1769100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE status_posts ADD COLUMN "mediaId" UUID`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE status_posts DROP COLUMN "mediaId"`);
  }
}
