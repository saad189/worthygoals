# Backend conventions

## Entity ID convention (closes audit L-1)

The codebase historically mixed ID types. The convention **going forward** is:

| ID type | Use for | Examples (existing) |
|---|---|---|
| `uuid` (VARCHAR 36, `gen_random_uuid()`) | All new domain entities | `goals`, `tasks`, `task_completions`, `media`, `memory_embeddings`, `push_tokens`, `notification_logs` |
| Human-readable slug (VARCHAR 64) | Seeded/config-like reference data | `personalities` (`marcus`, `lyra`, `goggs`) |
| `SERIAL` integer | **Legacy only — do not add new ones** | `users`, `accounts`, `mentors`, `conversations`, `messages`, `ai_calls`, `user_personalities`, `drift_samples` |

Rules:

1. Every **new** table gets a UUID primary key unless it is seeded reference
   data, in which case a slug is acceptable.
2. Do **not** migrate existing integer-keyed tables — the cost outweighs the
   benefit. The inconsistency is contained as long as it stops growing.
3. Foreign keys always match the referenced column's type exactly.
4. API routes accept whatever type the entity uses; ownership is always
   resolved server-side from the JWT `sub` claim, never trusted from the
   client (see GDPR/authz pass, Sprint 23).

## Authorization convention

Every endpoint that touches user-owned data derives the user from
`req.user.sub` (Cognito JWT) and verifies row ownership before acting.
No endpoint may accept a foreign `userId`/`id` path or body parameter to act
on another user's data — admin tooling, when it arrives, gets explicit
role-guarded routes instead.
