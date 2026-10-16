<!-- Generated: 2026-09-13 (ECC-11) | Files scanned: 394 ts/tsx across 3 workspaces | Token estimate: ~900 -->

# Architecture

Monorepo, three independent workspaces. **No root workspace manager** — npm runs
inside each workspace. See repo-root `CLAUDE.md` for the command matrix.

```
                    ┌──────────────────────────┐
  App Store /       │ worthygoals-frontend-app │  Expo 54 · RN 0.81 · React 19
  Play Store  ◄─────┤ expo-router file routes  │  TanStack Query + AsyncStorage
                    └───────────┬──────────────┘
                                │ REST (EXPO_PUBLIC_API_URL) + Socket.IO
                                ▼
                    ┌──────────────────────────┐
                    │  worthygoals-backend     │  NestJS 10 · TypeORM
                    │  14 controllers · 48 ops │  global JwtAuthGuard + Throttler
                    └──┬────────┬────────┬─────┘
                       │        │        │
        ┌──────────────┘        │        └──────────────┐
        ▼                       ▼                       ▼
  Postgres 16 + pgvector   Redis (BullMQ)         OpenAI / Anthropic
  25 entities · 7 migrations  push queue           via AiGatewayService
        │                       │                       │
        │                       ▼                       ▼
        │                 Expo Push API          S3 / Cloudflare R2
        │                                        AWS Cognito · SES
        ▼
  (no deploy target committed — see TRACKER §10 ECC-10 H1)

  ┌────────────────────────┐
  │ worthy-goals-main-site │  Angular 22 zoneless · 4 static routes
  │ waitlist funnel        │  → Cloudflare Worker (email capture)
  └────────────────────────┘  deployed by .github/workflows/deploy-marketing-site.yml
                              to Firebase Hosting (worthy-goals-9b4dd)
```

## Entry points

| Workspace | Entry | Boot side effects |
|---|---|---|
| backend | `src/main.ts` → `bootstrap()` | Sentry init (unused, ECC-10 H3), helmet, CORS, global `AllExceptionsFilter`, Swagger when `NODE_ENV !== 'prod'` |
| backend (data) | `src/database/dataSource.ts` | `migrationsRun: true` — **migrations apply at every boot** |
| frontend-app | `app/_layout.tsx` (expo-router root) | QueryClient, theme, auth bootstrap, push handler |
| main-site | `src/main.ts` → `app.config.ts` | zoneless CD, router with 4 `loadComponent()` routes |

## Request flow (backend)

```
HTTP → helmet → CORS → WsSkipThrottlerGuard (APP_GUARD, 100 req/60s per IP)
     → @UseGuards(JwtAuthGuard) class-level on 12 of 14 controllers  [Cognito JWT, jose]
     → ValidationPipe (APP_PIPE: whitelist + forbidNonWhitelisted)
     → Controller → Service → TypeORM Repository → Postgres
     → AllExceptionsFilter on throw  (logs to Nest Logger; nothing reaches Sentry)
```

The two exceptions are `app` (`GET /` — returns `'Hello World!'`, unguarded, and
**not** a health check, ECC-10 H4) and `auth`, which guards only `POST logout` at
method level; the other 7 auth routes are public by design.

## Async / scheduled work

| Trigger | Owner | Cadence |
|---|---|---|
| BullMQ `notifications` queue | `NotificationProcessor` | on job |
| `NotificationScheduler` | notifications | `EVERY_HOUR`, `EVERY_DAY_AT_6AM` |
| `NotificationCopyPregenCron` | notifications | `EVERY_DAY_AT_MIDNIGHT` |
| `TasksScheduler` | tasks | `EVERY_DAY_AT_1AM` |
| `MemoryDigestCron` | core/memory | `EVERY_WEEK` |

All in-process, no leader election — correct at one replica only (ECC-10 M1).

## Cross-workspace contract

`worthygoals-backend/openapi.json` → `worthygoals-frontend-app/types/api.gen.ts`
via `npm run generate:api`. **`openapi.json` is hand-authored and covers 8 of 48
operations**; `ci:check-api` is wired into nothing. Open item #4 / ECC-2.
