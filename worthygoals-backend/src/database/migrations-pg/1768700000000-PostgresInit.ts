import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Full Postgres schema init including pgvector.
 * Replaces the MySQL migration set for fresh Postgres installs.
 * Closes H-4: vector search is now an ANN query via pgvector, not O(n) JS.
 */
export class PostgresInit1768700000000 implements MigrationInterface {
  name = 'PostgresInit1768700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    // ── mentor_tags ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE mentor_tags (
        id          SERIAL PRIMARY KEY,
        slug        VARCHAR(64)   NOT NULL,
        label       VARCHAR(128)  NOT NULL,
        "createdAt" TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_mentor_tags_slug UNIQUE (slug)
      )
    `);

    // ── conversations (needed before messages) ────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE conversations (
        id              VARCHAR(36)   NOT NULL PRIMARY KEY,
        "userId"        INT           NOT NULL,
        "mentorId"      INT           NOT NULL,
        status          VARCHAR(16)   NOT NULL DEFAULT 'active',
        title           VARCHAR(180)  NULL,
        "lastMessageAt" TIMESTAMPTZ   NULL,
        "lastMessageId" VARCHAR(255)  NULL,
        metadata        JSONB         NULL,
        "createdAt"     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updatedAt"     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_conversations_user_id ON conversations ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_conversations_mentor_id ON conversations ("mentorId")`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_conversations_mentor_last_message_at ON conversations ("mentorId", "lastMessageAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_conversations_user_last_message_at ON conversations ("userId", "lastMessageAt")`,
    );

    // ── mentors (final state: base + sortOrder + modelConfig + personality_id) ─
    await queryRunner.query(`
      CREATE TABLE mentors (
        id                   SERIAL PRIMARY KEY,
        slug                 VARCHAR(120) NOT NULL,
        name                 VARCHAR(120) NOT NULL,
        title                VARCHAR(160) NULL,
        "shortDescription"   VARCHAR(300) NULL,
        "longDescription"    TEXT         NULL,
        "avatarUrl"          TEXT         NULL,
        "coverImageUrl"      TEXT         NULL,
        language             VARCHAR(16)  NOT NULL DEFAULT 'en',
        "supportedLanguages" JSONB        NULL,
        "communicationStyle" VARCHAR(32)  NOT NULL DEFAULT 'gentle',
        "responseLength"     VARCHAR(16)  NOT NULL DEFAULT 'medium',
        "personalityTraits"  JSONB        NULL,
        "promptBlocks"       JSONB        NOT NULL,
        "topicPolicy"        JSONB        NULL,
        "safetyPolicy"       JSONB        NULL,
        "memoryPolicy"       JSONB        NULL,
        "isActive"           BOOLEAN      NOT NULL DEFAULT TRUE,
        visibility           VARCHAR(16)  NOT NULL DEFAULT 'public',
        "isPremium"          BOOLEAN      NOT NULL DEFAULT FALSE,
        "requiredPlan"       VARCHAR(32)  NULL,
        version              INT          NOT NULL DEFAULT 1,
        "avgRating"          FLOAT        NOT NULL DEFAULT 0,
        "totalSessions"      INT          NOT NULL DEFAULT 0,
        "sortOrder"          INT          NOT NULL DEFAULT 0,
        "modelConfig"        JSONB        NULL,
        personality_id       VARCHAR(64)  NULL,
        "createdAt"          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "updatedAt"          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_mentors_slug UNIQUE (slug)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_mentors_name ON mentors (name)`);
    await queryRunner.query(
      `CREATE INDEX idx_mentors_language ON mentors (language)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_mentors_is_active ON mentors ("isActive")`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_mentors_visibility ON mentors (visibility)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_mentors_is_premium ON mentors ("isPremium")`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_mentors_version ON mentors (version)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_mentors_sort_order ON mentors ("sortOrder")`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_mentors_personality_id ON mentors (personality_id)`,
    );

    // ── messages ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE messages (
        id                  VARCHAR(36)  NOT NULL PRIMARY KEY,
        "conversationId"    VARCHAR(255) NOT NULL,
        role                VARCHAR(16)  NOT NULL,
        "userId"            INT          NULL,
        "mentorId"          INT          NULL,
        "contentType"       VARCHAR(16)  NOT NULL DEFAULT 'text',
        text                TEXT         NULL,
        content             JSONB        NULL,
        "clientMessageId"   VARCHAR(64)  NULL,
        "replyToMessageId"  VARCHAR(255) NULL,
        "tokensIn"          INT          NULL,
        "tokensOut"         INT          NULL,
        "safetyFlags"       JSONB        NULL,
        "archivedAt"        TIMESTAMPTZ  NULL,
        "createdAt"         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_messages_conversation_id ON messages ("conversationId")`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_messages_user_id ON messages ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_messages_mentor_id ON messages ("mentorId")`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_messages_conversation_id_id ON messages ("conversationId", id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_messages_conversation_archived_at ON messages ("conversationId", "archivedAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_messages_conversation_created_at ON messages ("conversationId", "createdAt")`,
    );

    // ── message_attachments ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE message_attachments (
        id                VARCHAR(36)  NOT NULL PRIMARY KEY,
        "messageId"       VARCHAR(255) NOT NULL,
        type              VARCHAR(16)  NOT NULL,
        "storageProvider" VARCHAR(16)  NOT NULL,
        "objectKey"       VARCHAR(512) NOT NULL,
        "mimeType"        VARCHAR(128) NULL,
        "sizeBytes"       BIGINT       NULL,
        "durationMs"      INT          NULL,
        width             INT          NULL,
        height            INT          NULL,
        "checksumSha256"  VARCHAR(128) NULL,
        "createdAt"       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_message_attachments_message_id ON message_attachments ("messageId")`,
    );

    // ── message_feedback ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE message_feedback (
        id          VARCHAR(36)  NOT NULL PRIMARY KEY,
        "messageId" VARCHAR(255) NOT NULL,
        "userId"    INT          NOT NULL,
        rating      SMALLINT     NOT NULL,
        tags        JSONB        NULL,
        comment     TEXT         NULL,
        "createdAt" TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_message_feedback_user_id ON message_feedback ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_message_feedback_message_id ON message_feedback ("messageId")`,
    );

    // ── conversation_summaries ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE conversation_summaries (
        id               VARCHAR(36)  NOT NULL PRIMARY KEY,
        "conversationId" VARCHAR(255) NOT NULL,
        "summaryType"    VARCHAR(16)  NOT NULL,
        "fromMessageId"  VARCHAR(255) NOT NULL,
        "toMessageId"    VARCHAR(255) NOT NULL,
        "summaryText"    TEXT         NOT NULL,
        "summaryEmotions" JSONB       NULL,
        "summaryTopics"  JSONB        NULL,
        "keyFacts"       JSONB        NULL,
        model            VARCHAR(64)  NULL,
        "promptVersion"  VARCHAR(32)  NULL,
        "createdAt"      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_conversation_summaries_range ON conversation_summaries ("conversationId", "fromMessageId", "toMessageId")`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_conversation_summaries_conversation_created_at ON conversation_summaries ("conversationId", "createdAt")`,
    );

    // ── conversation_memory_items ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE conversation_memory_items (
        id               VARCHAR(36)  NOT NULL PRIMARY KEY,
        "conversationId" VARCHAR(255) NOT NULL,
        key              VARCHAR(64)  NOT NULL,
        value            JSONB        NOT NULL,
        confidence       FLOAT        NULL,
        "sourceMessageId" VARCHAR(255) NULL,
        "createdAt"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "updatedAt"      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_memory_items_conversation_key ON conversation_memory_items ("conversationId", key)`,
    );

    // ── accounts ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE accounts (
        id            SERIAL PRIMARY KEY,
        sub           VARCHAR(255) NOT NULL,
        email         VARCHAR(255) NOT NULL,
        "isSignUp"    BOOLEAN      NULL DEFAULT FALSE,
        "dateAdded"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "dateUpdated" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_accounts_sub UNIQUE (sub),
        CONSTRAINT uq_accounts_email UNIQUE (email)
      )
    `);

    // ── permissions ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE permissions (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(255) NOT NULL,
        "dateAdded"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "dateUpdated" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_permissions_name UNIQUE (name)
      )
    `);

    // ── roles ─────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE roles (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(255) NOT NULL,
        "dateAdded"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "dateUpdated" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_roles_name UNIQUE (name)
      )
    `);

    // ── users (base + tier) ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE users (
        id            SERIAL PRIMARY KEY,
        email         VARCHAR(255) NOT NULL,
        "firstName"   VARCHAR(255) NULL,
        "lastName"    VARCHAR(255) NULL,
        "dateOfBirth" TIMESTAMPTZ  NULL,
        gender        CHAR(1)      NULL,
        latitude      DOUBLE PRECISION NULL,
        longitude     DOUBLE PRECISION NULL,
        "isAdmin"     BOOLEAN      NOT NULL DEFAULT FALSE,
        tier          VARCHAR(16)  NOT NULL DEFAULT 'free',
        "dateAdded"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "dateUpdated" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "accountId"   INT          NULL,
        "roleId"      INT          NULL,
        CONSTRAINT uq_users_account_id UNIQUE ("accountId")
      )
    `);

    // ── mentor_to_tags ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE mentor_to_tags (
        "mentorId" INT NOT NULL,
        "tagId"    INT NOT NULL,
        PRIMARY KEY ("mentorId", "tagId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_mentor_to_tags_mentor_id ON mentor_to_tags ("mentorId")`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_mentor_to_tags_tag_id ON mentor_to_tags ("tagId")`,
    );

    // ── role-permissions (hyphenated table name) ──────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "role-permissions" (
        "roleId"       INT NOT NULL,
        "permissionId" INT NOT NULL,
        PRIMARY KEY ("roleId", "permissionId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_role_permissions_role_id" ON "role-permissions" ("roleId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_role_permissions_permission_id" ON "role-permissions" ("permissionId")`,
    );

    // ── goals ─────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE goals (
        id            VARCHAR(36)    NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"      INT            NOT NULL,
        "mentorId"    INT            NULL,
        title         VARCHAR(255)   NOT NULL,
        description   TEXT           NULL,
        category      VARCHAR(32)    NOT NULL DEFAULT 'power',
        status        VARCHAR(16)    NOT NULL DEFAULT 'active',
        "costText"    TEXT           NULL,
        "benefitText" TEXT           NULL,
        "failureText" TEXT           NULL,
        deadline      TIMESTAMPTZ    NULL,
        "repeatRule"  JSONB          NULL,
        "stakeAmount" NUMERIC(10,2)  NULL,
        "imageUri"    VARCHAR(512)   NULL,
        "createdAt"   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
        "updatedAt"   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_goals_user_id ON goals ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_goals_user_status ON goals ("userId", status)`,
    );

    // ── tasks ─────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE tasks (
        id                VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
        "goalId"          VARCHAR(36) NOT NULL,
        title             VARCHAR(255) NOT NULL,
        description       TEXT         NULL,
        status            VARCHAR(16)  NOT NULL DEFAULT 'pending',
        "dueDate"         TIMESTAMPTZ  NULL,
        "repeatFrequency" VARCHAR(16)  NOT NULL DEFAULT 'none',
        "occurrenceIndex" INT          NOT NULL DEFAULT 0,
        "parentTaskId"    VARCHAR(36)  NULL,
        "createdAt"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "updatedAt"       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_tasks_goal_id ON tasks ("goalId")`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_tasks_goal_status ON tasks ("goalId", status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_tasks_due_date ON tasks ("dueDate")`,
    );

    // ── task_completions (includes mentor_reaction from S16) ──────────────────
    await queryRunner.query(`
      CREATE TABLE task_completions (
        id                VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
        "taskId"          VARCHAR(36) NOT NULL,
        "moodScore"       SMALLINT    NOT NULL,
        reflection        TEXT        NULL,
        "memoryPictureId" VARCHAR(36) NULL,
        mentor_reaction   TEXT        NULL,
        "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_completions_task_id ON task_completions ("taskId")`,
    );

    // ── task_explanations ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE task_explanations (
        id         VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
        "taskId"   VARCHAR(36) NOT NULL,
        reason     VARCHAR(32) NOT NULL,
        "freeText" TEXT        NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_explanations_task_id ON task_explanations ("taskId")`,
    );

    // ── media ─────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE media (
        id            VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"      INT          NOT NULL,
        "s3Key"       VARCHAR(512) NOT NULL,
        "contentType" VARCHAR(255) NULL,
        width         INT          NULL,
        height        INT          NULL,
        "isAttached"  BOOLEAN      NOT NULL DEFAULT FALSE,
        "uploadedAt"  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_media_user_id ON media ("userId")`,
    );

    // ── ai_calls ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE ai_calls (
        id             SERIAL PRIMARY KEY,
        "userId"       INT           NOT NULL,
        feature        VARCHAR(64)   NOT NULL,
        provider       VARCHAR(32)   NOT NULL,
        model          VARCHAR(64)   NOT NULL,
        "inputTokens"  INT           NULL,
        "outputTokens" INT           NULL,
        "costUsd"      NUMERIC(12,8) NULL,
        "latencyMs"    INT           NULL,
        "createdAt"    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_ai_calls_user_date ON ai_calls ("userId", "createdAt")`,
    );

    // ── personalities ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE personalities (
        id          VARCHAR(64)  NOT NULL PRIMARY KEY,
        name        VARCHAR(128) NOT NULL,
        description TEXT         NULL,
        "createdAt" TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);

    // ── user_personalities ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE user_personalities (
        id                  SERIAL      PRIMARY KEY,
        "userId"            INT         NOT NULL,
        "personalityId"     VARCHAR(64) NOT NULL,
        "relationshipState" JSONB       NOT NULL DEFAULT '{}',
        "escalationSlope"   FLOAT       NOT NULL DEFAULT 0,
        "activatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_user_personalities_user_id ON user_personalities ("userId")`,
    );

    // ── memory_embeddings (pgvector column replaces embeddingJson) ────────────
    await queryRunner.query(`
      CREATE TABLE memory_embeddings (
        id              VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"        INT         NOT NULL,
        "sourceType"    VARCHAR(32) NOT NULL,
        "sourceId"      VARCHAR(36) NULL,
        "embeddingText" TEXT        NOT NULL,
        embedding       vector(1536) NOT NULL,
        "personalityId" VARCHAR(64) NULL,
        "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_memory_embeddings_user_personality_created ON memory_embeddings ("userId", "personalityId", "createdAt")`,
    );
    // HNSW index for approximate nearest-neighbour cosine search
    await queryRunner.query(
      `CREATE INDEX idx_memory_embeddings_hnsw ON memory_embeddings USING hnsw (embedding vector_cosine_ops)`,
    );

    // ── memory_digests ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE memory_digests (
        id              VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"        INT          NOT NULL,
        "personalityId" VARCHAR(64)  NOT NULL,
        "digestText"    TEXT         NOT NULL,
        "periodStart"   DATE         NOT NULL,
        "periodEnd"     DATE         NOT NULL,
        "createdAt"     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_memory_digests_user_personality_created ON memory_digests ("userId", "personalityId", "createdAt")`,
    );

    // ── push_tokens ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE push_tokens (
        id          VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"    INT          NOT NULL,
        token       VARCHAR(512) NOT NULL,
        platform    VARCHAR(16)  NOT NULL DEFAULT 'expo',
        timezone    VARCHAR(64)  NULL,
        active      BOOLEAN      NOT NULL DEFAULT TRUE,
        "createdAt" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_push_tokens_user_token UNIQUE ("userId", token)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_push_tokens_user_active ON push_tokens ("userId", active)`,
    );

    // ── notification_logs ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE notification_logs (
        id          VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"    INT         NOT NULL,
        kind        VARCHAR(32) NOT NULL,
        "sentDate"  VARCHAR(10) NOT NULL,
        token       VARCHAR(512) NULL,
        status      VARCHAR(32) NOT NULL DEFAULT 'sent',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_notification_logs_user_date ON notification_logs ("userId", "sentDate")`,
    );

    // ── notification_copy_cache ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE notification_copy_cache (
        id              VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
        "personalityId" VARCHAR(32) NOT NULL,
        event           VARCHAR(48) NOT NULL,
        day             VARCHAR(10) NOT NULL,
        "contextHash"   VARCHAR(32) NOT NULL,
        body            TEXT        NOT NULL,
        "abVariant"     VARCHAR(8)  NOT NULL DEFAULT 'A',
        "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_notif_copy_cache UNIQUE ("personalityId", event, day, "contextHash")
      )
    `);

    // ── Seed personalities ────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO personalities (id, name, description) VALUES
        ('marcus', 'Marcus Aurelius', 'Stoic philosopher-king. Brief, unflinching, redirects every moment to duty and growth.'),
        ('lyra',   'Lyra',           'Warm, emotionally perceptive coach. Celebrates effort, holds space for struggle, always optimistic.'),
        ('goggs',  'Goggs',          'Drill instructor. Blunt, zero tolerance for excuses, relentless but not cruel.')
    `);

    // ── Foreign keys ──────────────────────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE message_attachments ADD CONSTRAINT fk_msg_attach_message FOREIGN KEY ("messageId") REFERENCES messages(id) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE message_feedback ADD CONSTRAINT fk_msg_feedback_message FOREIGN KEY ("messageId") REFERENCES messages(id) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE message_feedback ADD CONSTRAINT fk_msg_feedback_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE messages ADD CONSTRAINT fk_messages_conversation FOREIGN KEY ("conversationId") REFERENCES conversations(id) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE messages ADD CONSTRAINT fk_messages_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE messages ADD CONSTRAINT fk_messages_mentor FOREIGN KEY ("mentorId") REFERENCES mentors(id) ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE conversation_summaries ADD CONSTRAINT fk_conv_summaries_conv FOREIGN KEY ("conversationId") REFERENCES conversations(id) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE conversation_memory_items ADD CONSTRAINT fk_conv_mem_items_conv FOREIGN KEY ("conversationId") REFERENCES conversations(id) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE conversations ADD CONSTRAINT fk_conversations_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE conversations ADD CONSTRAINT fk_conversations_mentor FOREIGN KEY ("mentorId") REFERENCES mentors(id) ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE users ADD CONSTRAINT fk_users_account FOREIGN KEY ("accountId") REFERENCES accounts(id) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE users ADD CONSTRAINT fk_users_role FOREIGN KEY ("roleId") REFERENCES roles(id) ON DELETE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE mentor_to_tags ADD CONSTRAINT fk_mentor_to_tags_mentor FOREIGN KEY ("mentorId") REFERENCES mentors(id) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE mentor_to_tags ADD CONSTRAINT fk_mentor_to_tags_tag FOREIGN KEY ("tagId") REFERENCES mentor_tags(id) ON DELETE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role-permissions" ADD CONSTRAINT fk_role_perms_role FOREIGN KEY ("roleId") REFERENCES roles(id) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "role-permissions" ADD CONSTRAINT fk_role_perms_permission FOREIGN KEY ("permissionId") REFERENCES permissions(id) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE goals ADD CONSTRAINT fk_goals_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE goals ADD CONSTRAINT fk_goals_mentor FOREIGN KEY ("mentorId") REFERENCES mentors(id) ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE tasks ADD CONSTRAINT fk_tasks_goal FOREIGN KEY ("goalId") REFERENCES goals(id) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE task_completions ADD CONSTRAINT fk_completions_task FOREIGN KEY ("taskId") REFERENCES tasks(id) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE task_explanations ADD CONSTRAINT fk_explanations_task FOREIGN KEY ("taskId") REFERENCES tasks(id) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE media ADD CONSTRAINT fk_media_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE user_personalities ADD CONSTRAINT fk_user_personalities_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'notification_copy_cache',
      'notification_logs',
      'push_tokens',
      'memory_digests',
      'memory_embeddings',
      'user_personalities',
      'personalities',
      'ai_calls',
      'media',
      'task_explanations',
      'task_completions',
      'tasks',
      'goals',
      '"role-permissions"',
      'mentor_to_tags',
      'users',
      'roles',
      'permissions',
      'accounts',
      'conversation_memory_items',
      'conversation_summaries',
      'message_feedback',
      'message_attachments',
      'messages',
      'conversations',
      'mentors',
      'mentor_tags',
    ];
    for (const t of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS ${t} CASCADE`);
    }
    await queryRunner.query(`DROP EXTENSION IF EXISTS vector CASCADE`);
  }
}
