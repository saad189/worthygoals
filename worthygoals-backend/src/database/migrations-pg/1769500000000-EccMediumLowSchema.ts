import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Schema half of the ECC medium/low pass.
 *
 * - notification_logs.sentDate was VARCHAR(10) holding yyyy-MM-dd, compared
 *   lexicographically and happy to accept '2024-13-45' (ECC-1 M11).
 * - Indexes for the sorts that had none, each forcing a sort node over the
 *   whole filtered set: goals by createdAt, tasks by dueDate, conversations by
 *   (lastMessageAt, createdAt), and messages by (userId, createdAt) for the
 *   lapse-detection scan (ECC-1 M10, M17). The new conversations index
 *   supersedes idx_conversations_user_last_message_at, its prefix.
 * - drift_samples gains userId: it stores free text the user typed with no way
 *   to export or erase it per user (ECC-1 L19). Existing rows stay NULL — they
 *   cannot be attributed after the fact.
 */
export class EccMediumLowSchema1769500000000 implements MigrationInterface {
  name = 'EccMediumLowSchema1769500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE notification_logs ALTER COLUMN "sentDate" TYPE date USING "sentDate"::date`,
    );

    await queryRunner.query(
      `CREATE INDEX idx_goals_user_created_at ON goals ("userId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_tasks_goal_due_created ON tasks ("goalId", "dueDate", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_conversations_user_last_msg_created ON conversations ("userId", "lastMessageAt", "createdAt")`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_conversations_user_last_message_at`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_messages_user_created_at ON messages ("userId", "createdAt")`,
    );

    await queryRunner.query(
      `ALTER TABLE drift_samples ADD COLUMN "userId" INTEGER NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE drift_samples ADD CONSTRAINT fk_drift_samples_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_drift_samples_user_id ON drift_samples ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_drift_samples_user_id`);
    await queryRunner.query(
      `ALTER TABLE drift_samples DROP CONSTRAINT IF EXISTS fk_drift_samples_user`,
    );
    await queryRunner.query(`ALTER TABLE drift_samples DROP COLUMN "userId"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_messages_user_created_at`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_conversations_user_last_message_at ON conversations ("userId", "lastMessageAt")`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_conversations_user_last_msg_created`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tasks_goal_due_created`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_goals_user_created_at`);

    await queryRunner.query(
      `ALTER TABLE notification_logs ALTER COLUMN "sentDate" TYPE varchar(10) USING to_char("sentDate", 'YYYY-MM-DD')`,
    );
  }
}
