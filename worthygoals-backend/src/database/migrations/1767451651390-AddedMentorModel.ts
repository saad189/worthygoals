import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedMentorModel1767451651390 implements MigrationInterface {
    name = 'AddedMentorModel1767451651390'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`mentor_tags\` (\`id\` int NOT NULL AUTO_INCREMENT, \`slug\` varchar(64) NOT NULL, \`label\` varchar(128) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_0f0eb8184af086a80d04b93a85\` (\`slug\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`mentors\` (\`id\` int NOT NULL AUTO_INCREMENT, \`slug\` varchar(120) NOT NULL, \`name\` varchar(120) NOT NULL, \`title\` varchar(160) NULL, \`shortDescription\` varchar(300) NULL, \`longDescription\` text NULL, \`avatarUrl\` text NULL, \`coverImageUrl\` text NULL, \`language\` varchar(16) NOT NULL DEFAULT 'en', \`supportedLanguages\` json NULL, \`communicationStyle\` enum ('gentle', 'analytical', 'motivational', 'direct') NOT NULL DEFAULT 'gentle', \`responseLength\` enum ('short', 'medium', 'long') NOT NULL DEFAULT 'medium', \`personalityTraits\` json NULL, \`promptBlocks\` json NOT NULL, \`topicPolicy\` json NULL, \`safetyPolicy\` json NULL, \`memoryPolicy\` json NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`visibility\` enum ('public', 'private', 'beta') NOT NULL DEFAULT 'public', \`isPremium\` tinyint NOT NULL DEFAULT 0, \`requiredPlan\` varchar(32) NULL, \`version\` int NOT NULL DEFAULT '1', \`avgRating\` float NOT NULL DEFAULT '0', \`totalSessions\` int NOT NULL DEFAULT '0', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_2e86124983542791b954fba7f9\` (\`slug\`), INDEX \`IDX_f7e2eeddc22a75adc8aac80ac6\` (\`name\`), INDEX \`IDX_28e575ef07d48bd39139b959b7\` (\`language\`), INDEX \`IDX_dde49790ee41c834cb1c5dfb34\` (\`isActive\`), INDEX \`IDX_de485650db54c9f01b3c738ca6\` (\`visibility\`), INDEX \`IDX_64290b26a9856afbc8a2f0cd33\` (\`isPremium\`), INDEX \`IDX_d9913ada463a6ef62920d20122\` (\`version\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`mentor_to_tags\` (\`mentorId\` int NOT NULL, \`tagId\` int NOT NULL, INDEX \`IDX_612df12763b6c3624e7ae2f368\` (\`mentorId\`), INDEX \`IDX_9aedf297d2ee9f00c4ebbc2495\` (\`tagId\`), PRIMARY KEY (\`mentorId\`, \`tagId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`mentor_to_tags\` ADD CONSTRAINT \`FK_612df12763b6c3624e7ae2f3688\` FOREIGN KEY (\`mentorId\`) REFERENCES \`mentors\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`mentor_to_tags\` ADD CONSTRAINT \`FK_9aedf297d2ee9f00c4ebbc24952\` FOREIGN KEY (\`tagId\`) REFERENCES \`mentor_tags\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`mentor_to_tags\` DROP FOREIGN KEY \`FK_9aedf297d2ee9f00c4ebbc24952\``);
        await queryRunner.query(`ALTER TABLE \`mentor_to_tags\` DROP FOREIGN KEY \`FK_612df12763b6c3624e7ae2f3688\``);
        await queryRunner.query(`DROP INDEX \`IDX_9aedf297d2ee9f00c4ebbc2495\` ON \`mentor_to_tags\``);
        await queryRunner.query(`DROP INDEX \`IDX_612df12763b6c3624e7ae2f368\` ON \`mentor_to_tags\``);
        await queryRunner.query(`DROP TABLE \`mentor_to_tags\``);
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
    }

}
