import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1767458520562 implements MigrationInterface {
    name = 'InitialMigration1767458520562'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`permissions\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`dateAdded\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`dateUpdated\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_48ce552495d14eae9b187bb671\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`roles\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`dateAdded\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`dateUpdated\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`sub\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`firstName\` varchar(255) NULL, \`lastName\` varchar(255) NULL, \`dateOfBirth\` datetime NULL, \`gender\` char(1) NULL, \`latitude\` double NULL, \`longitude\` double NULL, \`isAdmin\` tinyint NOT NULL DEFAULT 0, \`dateAdded\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`dateUpdated\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`roleId\` int NULL, UNIQUE INDEX \`IDX_2ca016813ffcce3392b3eb8ed0\` (\`sub\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`mentor_tags\` (\`id\` int NOT NULL AUTO_INCREMENT, \`slug\` varchar(64) NOT NULL, \`label\` varchar(128) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_0f0eb8184af086a80d04b93a85\` (\`slug\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`mentors\` (\`id\` int NOT NULL AUTO_INCREMENT, \`slug\` varchar(120) NOT NULL, \`name\` varchar(120) NOT NULL, \`title\` varchar(160) NULL, \`shortDescription\` varchar(300) NULL, \`longDescription\` text NULL, \`avatarUrl\` text NULL, \`coverImageUrl\` text NULL, \`language\` varchar(16) NOT NULL DEFAULT 'en', \`supportedLanguages\` json NULL, \`communicationStyle\` enum ('gentle', 'analytical', 'motivational', 'direct') NOT NULL DEFAULT 'gentle', \`responseLength\` enum ('short', 'medium', 'long') NOT NULL DEFAULT 'medium', \`personalityTraits\` json NULL, \`promptBlocks\` json NOT NULL, \`topicPolicy\` json NULL, \`safetyPolicy\` json NULL, \`memoryPolicy\` json NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`visibility\` enum ('public', 'private', 'beta') NOT NULL DEFAULT 'public', \`isPremium\` tinyint NOT NULL DEFAULT 0, \`requiredPlan\` varchar(32) NULL, \`version\` int NOT NULL DEFAULT '1', \`avgRating\` float NOT NULL DEFAULT '0', \`totalSessions\` int NOT NULL DEFAULT '0', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_2e86124983542791b954fba7f9\` (\`slug\`), INDEX \`IDX_f7e2eeddc22a75adc8aac80ac6\` (\`name\`), INDEX \`IDX_28e575ef07d48bd39139b959b7\` (\`language\`), INDEX \`IDX_dde49790ee41c834cb1c5dfb34\` (\`isActive\`), INDEX \`IDX_de485650db54c9f01b3c738ca6\` (\`visibility\`), INDEX \`IDX_64290b26a9856afbc8a2f0cd33\` (\`isPremium\`), INDEX \`IDX_d9913ada463a6ef62920d20122\` (\`version\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`conversation_summaries\` (\`id\` varchar(36) NOT NULL, \`conversationId\` varchar(255) NOT NULL, \`summaryType\` varchar(16) NOT NULL, \`fromMessageId\` varchar(255) NOT NULL, \`toMessageId\` varchar(255) NOT NULL, \`summaryText\` text NOT NULL, \`summaryEmotions\` json NULL, \`summaryTopics\` json NULL, \`keyFacts\` json NULL, \`model\` varchar(64) NULL, \`promptVersion\` varchar(32) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`idx_conversation_summaries_range\` (\`conversationId\`, \`fromMessageId\`, \`toMessageId\`), INDEX \`idx_conversation_summaries_conversation_created_at\` (\`conversationId\`, \`createdAt\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`conversation_memory_items\` (\`id\` varchar(36) NOT NULL, \`conversationId\` varchar(255) NOT NULL, \`key\` varchar(64) NOT NULL, \`value\` json NOT NULL, \`confidence\` float NULL, \`sourceMessageId\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`idx_memory_items_conversation_key\` (\`conversationId\`, \`key\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`conversations\` (\`id\` varchar(36) NOT NULL, \`userId\` varchar(255) NOT NULL, \`mentorId\` int NOT NULL, \`status\` varchar(16) NOT NULL DEFAULT 'active', \`title\` varchar(180) NULL, \`lastMessageAt\` datetime NULL, \`lastMessageId\` varchar(255) NULL, \`metadata\` json NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`idx_conversations_user_id\` (\`userId\`), INDEX \`idx_conversations_mentor_id\` (\`mentorId\`), INDEX \`idx_conversations_mentor_last_message_at\` (\`mentorId\`, \`lastMessageAt\`), INDEX \`idx_conversations_user_last_message_at\` (\`userId\`, \`lastMessageAt\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`message_attachments\` (\`id\` varchar(36) NOT NULL, \`messageId\` varchar(255) NOT NULL, \`type\` varchar(16) NOT NULL, \`storageProvider\` varchar(16) NOT NULL, \`objectKey\` varchar(512) NOT NULL, \`mimeType\` varchar(128) NULL, \`sizeBytes\` bigint NULL, \`durationMs\` int NULL, \`width\` int NULL, \`height\` int NULL, \`checksumSha256\` varchar(128) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`idx_message_attachments_message_id\` (\`messageId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`messages\` (\`id\` varchar(36) NOT NULL, \`conversationId\` varchar(255) NOT NULL, \`role\` varchar(16) NOT NULL, \`userId\` varchar(255) NULL, \`mentorId\` int NULL, \`contentType\` varchar(16) NOT NULL DEFAULT 'text', \`text\` text NULL, \`content\` json NULL, \`clientMessageId\` varchar(64) NULL, \`replyToMessageId\` varchar(255) NULL, \`tokensIn\` int NULL, \`tokensOut\` int NULL, \`safetyFlags\` json NULL, \`archivedAt\` datetime NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`idx_messages_conversation_id\` (\`conversationId\`), INDEX \`idx_messages_user_id\` (\`userId\`), INDEX \`idx_messages_mentor_id\` (\`mentorId\`), INDEX \`idx_messages_conversation_id_id\` (\`conversationId\`, \`id\`), INDEX \`idx_messages_conversation_archived_at\` (\`conversationId\`, \`archivedAt\`), INDEX \`idx_messages_conversation_created_at\` (\`conversationId\`, \`createdAt\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`message_feedback\` (\`id\` varchar(36) NOT NULL, \`messageId\` varchar(255) NOT NULL, \`userId\` varchar(255) NOT NULL, \`rating\` smallint NOT NULL, \`tags\` json NULL, \`comment\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`idx_message_feedback_user_id\` (\`userId\`), INDEX \`idx_message_feedback_message_id\` (\`messageId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`role-permissions\` (\`roleId\` int NOT NULL, \`permissionId\` int NOT NULL, INDEX \`IDX_832f9475661d055310963d2f20\` (\`roleId\`), INDEX \`IDX_92ee53f7b01b6aaf1e6eac3297\` (\`permissionId\`), PRIMARY KEY (\`roleId\`, \`permissionId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`mentor_to_tags\` (\`mentorId\` int NOT NULL, \`tagId\` int NOT NULL, INDEX \`IDX_612df12763b6c3624e7ae2f368\` (\`mentorId\`), INDEX \`IDX_9aedf297d2ee9f00c4ebbc2495\` (\`tagId\`), PRIMARY KEY (\`mentorId\`, \`tagId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_368e146b785b574f42ae9e53d5e\` FOREIGN KEY (\`roleId\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`conversation_summaries\` ADD CONSTRAINT \`FK_397b444e96f3efa19e2e6bdc981\` FOREIGN KEY (\`conversationId\`) REFERENCES \`conversations\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`conversation_memory_items\` ADD CONSTRAINT \`FK_367daec8c1af22950503a78009c\` FOREIGN KEY (\`conversationId\`) REFERENCES \`conversations\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`conversations\` ADD CONSTRAINT \`FK_a9b3b5d51da1c75242055338b59\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`sub\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`conversations\` ADD CONSTRAINT \`FK_75a8d13206362081f72a9dcdf78\` FOREIGN KEY (\`mentorId\`) REFERENCES \`mentors\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`message_attachments\` ADD CONSTRAINT \`FK_5b4f24737fcb6b35ffdd4d16e13\` FOREIGN KEY (\`messageId\`) REFERENCES \`messages\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`messages\` ADD CONSTRAINT \`FK_e5663ce0c730b2de83445e2fd19\` FOREIGN KEY (\`conversationId\`) REFERENCES \`conversations\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`messages\` ADD CONSTRAINT \`FK_4838cd4fc48a6ff2d4aa01aa646\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`sub\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`messages\` ADD CONSTRAINT \`FK_611775860258f06ec9a4034be8b\` FOREIGN KEY (\`mentorId\`) REFERENCES \`mentors\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`message_feedback\` ADD CONSTRAINT \`FK_0b9283515f07ae088c9e0328609\` FOREIGN KEY (\`messageId\`) REFERENCES \`messages\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`message_feedback\` ADD CONSTRAINT \`FK_935ceb641a40fe337716a57a612\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`sub\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`role-permissions\` ADD CONSTRAINT \`FK_832f9475661d055310963d2f20d\` FOREIGN KEY (\`roleId\`) REFERENCES \`roles\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`role-permissions\` ADD CONSTRAINT \`FK_92ee53f7b01b6aaf1e6eac3297e\` FOREIGN KEY (\`permissionId\`) REFERENCES \`permissions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mentor_to_tags\` ADD CONSTRAINT \`FK_612df12763b6c3624e7ae2f3688\` FOREIGN KEY (\`mentorId\`) REFERENCES \`mentors\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`mentor_to_tags\` ADD CONSTRAINT \`FK_9aedf297d2ee9f00c4ebbc24952\` FOREIGN KEY (\`tagId\`) REFERENCES \`mentor_tags\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`mentor_to_tags\` DROP FOREIGN KEY \`FK_9aedf297d2ee9f00c4ebbc24952\``);
        await queryRunner.query(`ALTER TABLE \`mentor_to_tags\` DROP FOREIGN KEY \`FK_612df12763b6c3624e7ae2f3688\``);
        await queryRunner.query(`ALTER TABLE \`role-permissions\` DROP FOREIGN KEY \`FK_92ee53f7b01b6aaf1e6eac3297e\``);
        await queryRunner.query(`ALTER TABLE \`role-permissions\` DROP FOREIGN KEY \`FK_832f9475661d055310963d2f20d\``);
        await queryRunner.query(`ALTER TABLE \`message_feedback\` DROP FOREIGN KEY \`FK_935ceb641a40fe337716a57a612\``);
        await queryRunner.query(`ALTER TABLE \`message_feedback\` DROP FOREIGN KEY \`FK_0b9283515f07ae088c9e0328609\``);
        await queryRunner.query(`ALTER TABLE \`messages\` DROP FOREIGN KEY \`FK_611775860258f06ec9a4034be8b\``);
        await queryRunner.query(`ALTER TABLE \`messages\` DROP FOREIGN KEY \`FK_4838cd4fc48a6ff2d4aa01aa646\``);
        await queryRunner.query(`ALTER TABLE \`messages\` DROP FOREIGN KEY \`FK_e5663ce0c730b2de83445e2fd19\``);
        await queryRunner.query(`ALTER TABLE \`message_attachments\` DROP FOREIGN KEY \`FK_5b4f24737fcb6b35ffdd4d16e13\``);
        await queryRunner.query(`ALTER TABLE \`conversations\` DROP FOREIGN KEY \`FK_75a8d13206362081f72a9dcdf78\``);
        await queryRunner.query(`ALTER TABLE \`conversations\` DROP FOREIGN KEY \`FK_a9b3b5d51da1c75242055338b59\``);
        await queryRunner.query(`ALTER TABLE \`conversation_memory_items\` DROP FOREIGN KEY \`FK_367daec8c1af22950503a78009c\``);
        await queryRunner.query(`ALTER TABLE \`conversation_summaries\` DROP FOREIGN KEY \`FK_397b444e96f3efa19e2e6bdc981\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_368e146b785b574f42ae9e53d5e\``);
        await queryRunner.query(`DROP INDEX \`IDX_9aedf297d2ee9f00c4ebbc2495\` ON \`mentor_to_tags\``);
        await queryRunner.query(`DROP INDEX \`IDX_612df12763b6c3624e7ae2f368\` ON \`mentor_to_tags\``);
        await queryRunner.query(`DROP TABLE \`mentor_to_tags\``);
        await queryRunner.query(`DROP INDEX \`IDX_92ee53f7b01b6aaf1e6eac3297\` ON \`role-permissions\``);
        await queryRunner.query(`DROP INDEX \`IDX_832f9475661d055310963d2f20\` ON \`role-permissions\``);
        await queryRunner.query(`DROP TABLE \`role-permissions\``);
        await queryRunner.query(`DROP INDEX \`idx_message_feedback_message_id\` ON \`message_feedback\``);
        await queryRunner.query(`DROP INDEX \`idx_message_feedback_user_id\` ON \`message_feedback\``);
        await queryRunner.query(`DROP TABLE \`message_feedback\``);
        await queryRunner.query(`DROP INDEX \`idx_messages_conversation_created_at\` ON \`messages\``);
        await queryRunner.query(`DROP INDEX \`idx_messages_conversation_archived_at\` ON \`messages\``);
        await queryRunner.query(`DROP INDEX \`idx_messages_conversation_id_id\` ON \`messages\``);
        await queryRunner.query(`DROP INDEX \`idx_messages_mentor_id\` ON \`messages\``);
        await queryRunner.query(`DROP INDEX \`idx_messages_user_id\` ON \`messages\``);
        await queryRunner.query(`DROP INDEX \`idx_messages_conversation_id\` ON \`messages\``);
        await queryRunner.query(`DROP TABLE \`messages\``);
        await queryRunner.query(`DROP INDEX \`idx_message_attachments_message_id\` ON \`message_attachments\``);
        await queryRunner.query(`DROP TABLE \`message_attachments\``);
        await queryRunner.query(`DROP INDEX \`idx_conversations_user_last_message_at\` ON \`conversations\``);
        await queryRunner.query(`DROP INDEX \`idx_conversations_mentor_last_message_at\` ON \`conversations\``);
        await queryRunner.query(`DROP INDEX \`idx_conversations_mentor_id\` ON \`conversations\``);
        await queryRunner.query(`DROP INDEX \`idx_conversations_user_id\` ON \`conversations\``);
        await queryRunner.query(`DROP TABLE \`conversations\``);
        await queryRunner.query(`DROP INDEX \`idx_memory_items_conversation_key\` ON \`conversation_memory_items\``);
        await queryRunner.query(`DROP TABLE \`conversation_memory_items\``);
        await queryRunner.query(`DROP INDEX \`idx_conversation_summaries_conversation_created_at\` ON \`conversation_summaries\``);
        await queryRunner.query(`DROP INDEX \`idx_conversation_summaries_range\` ON \`conversation_summaries\``);
        await queryRunner.query(`DROP TABLE \`conversation_summaries\``);
        await queryRunner.query(`DROP INDEX \`IDX_d9913ada463a6ef62920d20122\` ON \`mentors\``);
        await queryRunner.query(`DROP INDEX \`IDX_64290b26a9856afbc8a2f0cd33\` ON \`mentors\``);
        await queryRunner.query(`DROP INDEX \`IDX_de485650db54c9f01b3c738ca6\` ON \`mentors\``);
        await queryRunner.query(`DROP INDEX \`IDX_dde49790ee41c834cb1c5dfb34\` ON \`mentors\``);
        await queryRunner.query(`DROP INDEX \`IDX_28e575ef07d48bd39139b959b7\` ON \`mentors\``);
        await queryRunner.query(`DROP INDEX \`IDX_f7e2eeddc22a75adc8aac80ac6\` ON \`mentors\``);
        await queryRunner.query(`DROP INDEX \`IDX_2e86124983542791b954fba7f9\` ON \`mentors\``);
        await queryRunner.query(`DROP TABLE \`mentors\``);
        await queryRunner.query(`DROP INDEX \`IDX_0f0eb8184af086a80d04b93a85\` ON \`mentor_tags\``);
        await queryRunner.query(`DROP TABLE \`mentor_tags\``);
        await queryRunner.query(`DROP INDEX \`IDX_2ca016813ffcce3392b3eb8ed0\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` ON \`roles\``);
        await queryRunner.query(`DROP TABLE \`roles\``);
        await queryRunner.query(`DROP INDEX \`IDX_48ce552495d14eae9b187bb671\` ON \`permissions\``);
        await queryRunner.query(`DROP TABLE \`permissions\``);
    }

}
