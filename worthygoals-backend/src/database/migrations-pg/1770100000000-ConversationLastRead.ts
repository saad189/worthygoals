import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-thread read marker for the messages list's unread dot (QA-40), which
 * was hard-coded to "read".
 *
 * Existing threads are backfilled as read up to their last message, so the
 * first launch after this ships doesn't light up every conversation the user
 * has already seen.
 */
export class ConversationLastRead1770100000000 implements MigrationInterface {
  name = 'ConversationLastRead1770100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD "lastReadAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `UPDATE "conversations" SET "lastReadAt" = "lastMessageAt"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP COLUMN "lastReadAt"`,
    );
  }
}
