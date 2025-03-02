import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1740881454148 implements MigrationInterface {
    name = 'InitialMigration1740881454148'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`permissions\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`dateAdded\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`dateUpdated\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_48ce552495d14eae9b187bb671\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`roles\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`dateAdded\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`dateUpdated\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`sub\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`firstName\` varchar(255) NULL, \`lastName\` varchar(255) NULL, \`dateOfBirth\` datetime NULL, \`gender\` char(1) NULL, \`latitude\` double NULL, \`longitude\` double NULL, \`isAdmin\` tinyint NOT NULL DEFAULT 0, \`dateAdded\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`dateUpdated\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`roleId\` int NULL, UNIQUE INDEX \`IDX_2ca016813ffcce3392b3eb8ed0\` (\`sub\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`role-permissions\` (\`roleId\` int NOT NULL, \`permissionId\` int NOT NULL, INDEX \`IDX_832f9475661d055310963d2f20\` (\`roleId\`), INDEX \`IDX_92ee53f7b01b6aaf1e6eac3297\` (\`permissionId\`), PRIMARY KEY (\`roleId\`, \`permissionId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_368e146b785b574f42ae9e53d5e\` FOREIGN KEY (\`roleId\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`role-permissions\` ADD CONSTRAINT \`FK_832f9475661d055310963d2f20d\` FOREIGN KEY (\`roleId\`) REFERENCES \`roles\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`role-permissions\` ADD CONSTRAINT \`FK_92ee53f7b01b6aaf1e6eac3297e\` FOREIGN KEY (\`permissionId\`) REFERENCES \`permissions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`role-permissions\` DROP FOREIGN KEY \`FK_92ee53f7b01b6aaf1e6eac3297e\``);
        await queryRunner.query(`ALTER TABLE \`role-permissions\` DROP FOREIGN KEY \`FK_832f9475661d055310963d2f20d\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_368e146b785b574f42ae9e53d5e\``);
        await queryRunner.query(`DROP INDEX \`IDX_92ee53f7b01b6aaf1e6eac3297\` ON \`role-permissions\``);
        await queryRunner.query(`DROP INDEX \`IDX_832f9475661d055310963d2f20\` ON \`role-permissions\``);
        await queryRunner.query(`DROP TABLE \`role-permissions\``);
        await queryRunner.query(`DROP INDEX \`IDX_2ca016813ffcce3392b3eb8ed0\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` ON \`roles\``);
        await queryRunner.query(`DROP TABLE \`roles\``);
        await queryRunner.query(`DROP INDEX \`IDX_48ce552495d14eae9b187bb671\` ON \`permissions\``);
        await queryRunner.query(`DROP TABLE \`permissions\``);
    }

}
