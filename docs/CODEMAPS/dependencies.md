<!-- Generated: 2026-09-13 (ECC-11) | Token estimate: ~800 -->

# External services & integrations

## Backend

| Service | Used for | Env | Absent ⇒ |
|---|---|---|---|
| **AWS Cognito** | all auth (signup, login, refresh, password) | `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_COGNITO_USER_POOL_ID`, `AWS_COGNITO_APP_CLIENT_ID`, `AWS_COGNITO_APP_CLIENT_SECRET?` | boot fails (required) |
| **Postgres + pgvector** | primary store, RAG embeddings | `DB_HOST/PORT/USERNAME/PASSWORD/NAME`, `DB_SSL`*, `DB_LOGGING`* | boot fails |
| **OpenAI** | chat, goal proposal, embeddings, notification copy | `OPENAI_API_KEY`, `OPENAI_MODEL` (`gpt-4o-mini`), `EMBEDDING_MODEL` | boot fails |
| **Anthropic** | Tier-2 provider | `ANTHROPIC_API_KEY`, `AI_ACTIVE_PROVIDER` | silent no-op |
| **Redis / BullMQ** | push notification queue | `REDIS_URL` | **defaults to `localhost:6379`** — boots clean, queues into nothing |
| **Expo Push API** | delivery | `EXPO_ACCESS_TOKEN` | silent no-op |
| **S3 / Cloudflare R2** | media upload (presigned PUT) | `S3_ENDPOINT`, `S3_BUCKET_NAME`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION` | silent no-op |
| **AWS SES** | support email | `SUPPORT_EMAIL_SENDER` | silent no-op |
| **Sentry** | error reporting | `SENTRY_DSN` | — **initialised but never called; no errors reach it either way** (ECC-10 H3) |

`*` read straight off `process.env`, absent from the Joi schema **and** from
`docs/ENV.md` — alongside `ALLOWED_ORIGINS`. ECC-10 M2/M3.

## Frontend app

| Service | Env | Note |
|---|---|---|
| Backend REST + Socket.IO | `EXPO_PUBLIC_API_URL` | **not set in any EAS profile** (item #37) |
| Sentry | `EXPO_PUBLIC_SENTRY_DSN` | DSN is bundle-public by design |
| PostHog | `EXPO_PUBLIC_POSTHOG_KEY` | `services/observability.ts` |
| Expo Notifications | — | `expo-notifications` + `expo-device` plugins |

All `EXPO_PUBLIC_*` values are embedded in the JS bundle. `.env.local` is read
by `expo start` only — **EAS Build never sees it**.

## Marketing site

| Service | Note |
|---|---|
| **Cloudflare Worker** | waitlist email capture; URL in `src/app/data/content.ts:228` (real, not the demo stub) |
| **Firebase Hosting** | project `worthy-goals-9b4dd`, target `worthygoals`; deployed by `.github/workflows/deploy-marketing-site.yml` via `FIREBASE_SERVICE_ACCOUNT_WORTHY_GOALS` |
| Google Fonts | Geist, JetBrains Mono, Newsreader — render-blocking on the LCP path |

No analytics of any kind on the funnel (ECC-9 L3).

## Notable internal dependencies

- `openapi.json` → `types/api.gen.ts` (`npm run generate:api`). Hand-authored,
  8/48 operations, no CI gate.
- `react-native-paper` is **not** removable: its `Snackbar` backs `useToast`
  across ~7 screens and its MD3 theme feeds `useAppTheme().paperTheme`.
- Personality YAMLs (`core/personalities/data/*.yaml`) are runtime assets, not
  code — nest-cli copies them to the wrong path in the build (ECC-10 C1).

## Deployment

| Workspace | Pipeline |
|---|---|
| marketing site | ✅ `deploy-marketing-site.yml` → Firebase Hosting |
| backend | ❌ **none** — `Dockerfile` only; Fly.io removed in TD-3, docs still describe it (ECC-10 H1) |
| frontend app | ❌ **none** — EAS configured but `production` profile is empty |
