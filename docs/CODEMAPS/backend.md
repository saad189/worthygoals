<!-- Generated: 2026-09-13 (ECC-11) | Files scanned: 197 ts | ~14.4k LOC | Token estimate: ~950 -->

# Backend — `worthygoals-backend`

NestJS 10 · TypeORM · Postgres 16 + pgvector 0.8.3 · Redis/BullMQ · 25 test suites / 180 tests.

## Routes — 14 controllers, 48 operations

All under `src/modules/<name>/<name>.controller.ts`. 12 of the 14 carry
`@UseGuards(JwtAuthGuard)` at class level; `auth` guards only `POST logout` at
method level (its other 7 routes are public by design), and `app` is unguarded.

```
auth            POST   login · refresh-token · logout · signup · confirm-signup
                       confirmation-code · forgot-password-code · change-password
users           GET    profile          PUT  profile
                POST   me/data-export   DELETE me          POST /users
mentors         GET    / · /:id         POST / · PATCH /:id · DELETE /:id
conversations   GET    / · /:id         POST / · PATCH /:id · DELETE /:id
messages        GET    /                POST /
goals           POST   propose          POST / · GET / · GET /:id · PATCH · DELETE
tasks           POST   / · GET / · GET /:id · PATCH /:id · DELETE /:id
                POST   :id/complete     POST :id/explain
status          GET    /                POST /
board           GET    /
dashboard       GET    /
weekly-review   GET    /
notifications   POST   token            DELETE token/:token   GET tokens
media           POST   upload-url       (presigned S3/R2 PUT)
app             GET    /                ← unguarded, returns 'Hello World!'
```

WebSocket: `src/modules/messages/messages.gateway.ts` (Socket.IO), authed by
`WsJwtAuthGuard`, exempted from throttling by `WsSkipThrottlerGuard`.

## Layers

```
modules/<n>/<n>.controller.ts  → <n>.service.ts → TypeORM Repository
                                  ↘ core/* for anything AI, memory, safety, cache
```

## `src/core` — the shared engine

| Path | Responsibility |
|---|---|
| `ai/gateway/ai-gateway.service.ts` | `chat()` / `chatStream()`; provider routing, personality injection, cost accounting |
| `ai/gateway/openai.provider.ts`, `anthropic.provider.ts` | provider adapters (`AI_ACTIVE_PROVIDER`) |
| `ai/gateway/circuit-breaker.ts` | trips the provider out on repeated failure |
| `ai/agent.service.ts` | `buildAgentInstructionsByMentorId()`, `generateMentorReply()`, boot-time `validatePersonalityMappings()` |
| `ai/quota/quota.service.ts` | per-user AI spend caps |
| `personalities/personality.loader.ts` | reads `data/*.yaml` (lyra, goggs, marcus) at `onModuleInit` — **path breaks in the built image, ECC-10 C1** |
| `memory/memory.service.ts`, `embedding.service.ts` | pgvector RAG retrieval + write |
| `memory/memory-digest.cron.ts` | weekly rollup |
| `safety/safety.service.ts` | content guard on AI in/out |
| `cache/cache.service.ts` | `@nestjs/cache-manager` wrapper |

## `src/common`

`guards/` — `jwtauth.guard.ts` (Cognito JWKS via `jose`), `ws-jwtauth.guard.ts`,
`throttler-ws.guard.ts`. `filters/http-exception.filter.ts` — global `@Catch()`.
`constants/`, `interfaces/`, `validators/`. `decorators/`, `interceptors/`,
`pipes/` exist but are **empty**.

## `src/config`

`env.validation.ts` (Joi, `abortEarly: false`, 11 required) · `config.module.ts`
(global, `.env.${NODE_ENV}`) · `typeorm.module.ts` (`ensureDatabase()` then
`forRootAsync`, registers the pgvector type parser) · `database.config.ts`.

`ALLOWED_ORIGINS`, `DB_SSL`, `DB_LOGGING` bypass the Joi schema entirely — ECC-10 M2.

## Build & run

`nest build` → **`dist/src/main.js`**, while `Dockerfile` and `start:prod` both
run `node dist/main`. **The production container does not start.** ECC-10 C1 —
fix is `"include": ["src/**/*"]` in `tsconfig.build.json`.
