import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * One conversation per user per mentor, enforced by the database.
 *
 * ConversationsService.create checked for an existing thread and then
 * inserted, so a double tap on "Chat with X" could open two. Duplicates are
 * merged into the oldest thread first: messages, summaries and memory items
 * move onto it (nothing the user wrote or was told is lost), its last-message
 * pointers take the newest across the group, and the emptied extras go.
 */
export class UniqueConversationPerMentor1770200000000
  implements MigrationInterface
{
  name = 'UniqueConversationPerMentor1770200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // dup → the oldest conversation of its (userId, mentorId) group.
    await queryRunner.query(`
      CREATE TEMP TABLE conversation_merge ON COMMIT DROP AS
      SELECT id AS dup, keeper
        FROM (SELECT id,
                     first_value(id) OVER (PARTITION BY "userId", "mentorId"
                                           ORDER BY "createdAt", id) AS keeper
                FROM conversations) c
       WHERE id <> keeper
    `);
    for (const table of [
      'messages',
      'conversation_summaries',
      'conversation_memory_items',
    ]) {
      await queryRunner.query(`
        UPDATE "${table}" t SET "conversationId" = m.keeper
          FROM conversation_merge m
         WHERE t."conversationId" = m.dup
      `);
    }
    await queryRunner.query(`
      UPDATE conversations k
         SET "lastMessageAt" = latest."createdAt",
             "lastMessageId" = latest.id
        FROM (SELECT DISTINCT ON ("conversationId") "conversationId", id, "createdAt"
                FROM messages
               WHERE "conversationId" IN (SELECT keeper FROM conversation_merge)
               ORDER BY "conversationId", "createdAt" DESC) latest
       WHERE k.id = latest."conversationId"
    `);
    await queryRunner.query(
      `DELETE FROM conversations WHERE id IN (SELECT dup FROM conversation_merge)`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_conversations_user_mentor" ON "conversations" ("userId", "mentorId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // The merge is not reversible; only the constraint is.
    await queryRunner.query(
      `DROP INDEX "public"."uq_conversations_user_mentor"`,
    );
  }
}
