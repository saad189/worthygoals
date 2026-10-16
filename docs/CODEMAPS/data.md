<!-- Generated: 2026-09-13 (ECC-11) | 25 entities · 7 migrations | Token estimate: ~800 -->

# Data layer

Postgres 16 + **pgvector 0.8.3** (so `hnsw.iterative_scan` is available).
Local dev publishes on **port 5433**, not 5432. Entities:
`src/database/models/*.entity.ts`. Migrations: **`src/database/migrations-pg/`**
— `src/database/migrations/` does not exist despite some script paths naming it.

## Relationships

```
roles ──┬─ M:N permissions
        └─ 1:N users
users ──┬─ 1:1 accounts
        ├─ 1:N conversations ──┬─ 1:N messages ──┬─ 1:N message_attachments
        │                      │                 └─ 1:N message_feedback
        │                      ├─ 1:N conversation_summaries
        │                      └─ 1:N conversation_memory_items
        ├─ 1:N goals ─── 1:N tasks ──┬─ 1:N task_completions
        │                            └─ 1:N task_explanations
        ├─ 1:N status_posts ─── 1:N status_reactions
        ├─ 1:N message_feedback
        └─ personalityId  (scalar FK → the live voicing source)

mentors ─┬─ 1:N conversations
         └─ 1:N messages
goals   ─── M:1 mentors

standalone: ai_calls · drift_samples · memory_digests · memory_embeddings
            notification_logs · notification_copy_cache · push_tokens
            user_personalities  ← 0 rows, no writers (dead, item #9/#16-ECC-1)
```

## Migration history — `migrations-pg/`

| Timestamp | Name |
|---|---|
| 1768700000000 | `PostgresInit` — full schema + seed |
| 1768800000000 | `AddDriftSamples` |
| 1768900000000 | `AddStatusTables` |
| 1769000000000 | `AddUserTone` |
| 1769100000000 | `AddStatusPostMedia` |
| 1769200000000 | `AddUserPersonalityId` |
| 1769300000000 | `DropDeadPersonaTables` |

All seven implement a real `down()` — including `DropDeadPersonaTables`, which
recreates structure *and* seed rows.

## Operational facts

- `dataSource.ts` sets **`migrationsRun: true`** — pending migrations apply on
  every container boot, before traffic, with no advisory lock (ECC-10 H2).
- `typeorm.module.ts` calls `DatabaseService.ensureDatabase()` first (creates the
  DB if absent), then registers the pgvector type parser so `vector` columns
  deserialize to `number[]`.
- `autoLoadEntities: true` — needed because `Media` is registered via
  `forFeature` outside the `src/database` glob (fixed the GDPR-export 500).
- `synchronize: false` always. `logging` is `['error','warn']` unless
  `DB_LOGGING=true` (full SQL logging leaks PII).
- `ssl` only when `DB_SSL=true`, and then with `rejectUnauthorized: false`.
- **Rollback cannot be run from the container**: `typeorm:revert` needs
  `ts-node` + `src/`, and the runtime image is `--omit=dev` and dist-only.

## Seeding

`npm run seed` (`seed-runner.ts`, upsert-by-slug + retire) — explicit only,
never at boot. `seed:individual` for one entity. The `:memory` variants raise
the heap to 8 GB; the full seed needs it.
