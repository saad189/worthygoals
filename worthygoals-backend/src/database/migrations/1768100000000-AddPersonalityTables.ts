import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPersonalityTables1768100000000 implements MigrationInterface {
  name = 'AddPersonalityTables1768100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE personalities (
        id VARCHAR(64) NOT NULL,
        name VARCHAR(128) NOT NULL,
        description TEXT NULL,
        createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE user_personalities (
        id INT NOT NULL AUTO_INCREMENT,
        userId INT NOT NULL,
        personalityId VARCHAR(64) NOT NULL,
        relationshipState JSON NOT NULL DEFAULT ('{}'),
        escalationSlope FLOAT NOT NULL DEFAULT 0,
        activatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        INDEX IDX_user_personalities_userId (userId),
        CONSTRAINT FK_user_personalities_user FOREIGN KEY (userId)
          REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      INSERT INTO personalities (id, name, description) VALUES
        ('marcus', 'Marcus Aurelius', 'Stoic philosopher-king. Brief, unflinching, redirects every moment to duty and growth.'),
        ('lyra', 'Lyra', 'Warm, emotionally perceptive coach. Celebrates effort, holds space for struggle, always optimistic.'),
        ('goggs', 'Goggs', 'Drill instructor. Blunt, zero tolerance for excuses, relentless but not cruel.')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE user_personalities`);
    await queryRunner.query(`DROP TABLE personalities`);
  }
}
