# Environment Variables & Secrets

Every env var and secret used in Worthy Goals. The authority is
`worthygoals-backend/src/config/env.validation.ts`; this document tracks it,
and `.env.local.example` in each package is a working copy to start from.

> Rewritten Sep 2026. The previous version documented MySQL on port 3306
> (the backend moved to Postgres + pgvector in S18), documented Fly.io secrets
> for a `deploy.yml` that was deleted in Jul 2026, and omitted eight variables
> the backend reads.

---

## Backend (`worthygoals-backend`)

Copy `worthygoals-backend/.env.local.example` → `.env.local`.

Required keys are validated at startup via Joi. Missing ones abort the boot
with every problem listed at once (`abortEarly: false`).

### Server

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | ✅ | — | One of `local`, `lazy`, `dev`, `prod`. Set by the npm scripts and the Dockerfile. Production is **`prod`**, not `production` — nothing else disables Swagger. No default: a missing value fails boot rather than falling open to `local`. |
| `PORT` | — | `3000` | |
| `SERVER_URL` | — | `http://localhost` | Used to build the Swagger server URL. |
| `ALLOWED_ORIGINS` | — | — | Comma-separated `http(s)://` origins, validated at boot. Applies to HTTP **and** the Socket.IO gateway. With none set, prod allows **no** browser origins and dev allows all. The native app sends no `Origin` and is unaffected. |

### Database (PostgreSQL + pgvector)

| Variable | Required | Default | Notes |
|---|---|---|---|
| `DB_HOST` | ✅ | — | e.g. `localhost` |
| `DB_PORT` | ✅ | — | Postgres, so usually `5432` |
| `DB_USERNAME` | ✅ | — | |
| `DB_PASSWORD` | ✅ | — | |
| `DB_NAME` | ✅ | — | e.g. `worthygoals` |
| `DB_LOGGING` | — | `false` | `true` enables full SQL logging, which prints PII (emails, goal text). Errors and warnings are always logged. |
| `DB_SSL` | — | `false` | `true` for managed Postgres. Only `true`/`false` accepted. |
| `DB_SSL_REJECT_UNAUTHORIZED` | — | `true` | Set `false` only for a provider whose certificate chain Node cannot verify. Verification used to be hard-coded off. |
| `DB_POOL_MAX` | — | `10` | Postgres connection pool size. Every statement also has a 30 s `statement_timeout`. |

Migrations run at boot under a Postgres advisory lock, so concurrent replicas
do not race. To inspect or revert from inside a running container:

```bash
npm run migration:show:dist
npm run migration:revert:dist
```

These run against `dist/`, so they work in the runtime image — the `ts-node`
variants need devDependencies and only work on a developer machine.

### AWS / Cognito

| Variable | Required | Default | Where to get it |
|---|---|---|---|
| `AWS_REGION` | ✅ | — | e.g. `eu-north-1` |
| `AWS_ACCESS_KEY_ID` | ✅ | — | IAM key with Cognito + SES permissions |
| `AWS_SECRET_ACCESS_KEY` | ✅ | — | IAM secret |
| `AWS_COGNITO_USER_POOL_ID` | ✅ | — | Cognito → User Pools → Pool ID |
| `AWS_COGNITO_APP_CLIENT_ID` | ✅ | — | Cognito → App clients → Client ID |
| `AWS_COGNITO_APP_CLIENT_SECRET` | — | — | Only if the app client has a secret. Left blank, `SECRET_HASH` is omitted from every Cognito call rather than sent empty. |

SES falls back to `AWS_SES_REGION` / `AWS_SES_ACCESS_KEY_ID` /
`AWS_SES_SECRET_ACCESS_KEY` when set, otherwise the `AWS_*` values above,
otherwise the SDK's own credential chain.

### AI

| Variable | Required | Default | Notes |
|---|---|---|---|
| `OPENAI_API_KEY` | ✅ | — | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `OPENAI_MODEL` | — | `gpt-4o-mini` | |
| `EMBEDDING_MODEL` | — | `text-embedding-3-small` | Used by the pgvector memory layer. |
| `AI_ACTIVE_PROVIDER` | — | `openai` | `openai` or `anthropic`. |
| `ANTHROPIC_API_KEY` | — | — | Second provider; graceful no-op when absent. |
| `AI_MODEL_COSTS_JSON` | — | — | JSON map of model → `{ in, out }` cost per million tokens. Falls back to hard-coded defaults, so prices can change without a redeploy. |

A single model call is capped at 45s so an abandoned request stops billing.

### Push notifications

| Variable | Required | Default | Notes |
|---|---|---|---|
| `REDIS_URL` | prod: ✅ | `redis://localhost:6379` (non-prod) | BullMQ connection. Required in `prod`: the localhost default let a Redis-less instance boot and queue pushes into nothing. |
| `EXPO_ACCESS_TOKEN` | — | — | Expo push. Graceful no-op when absent. |

### Media storage (S3 / R2)

All optional — with none set, media features no-op rather than fail.

| Variable | Default | Notes |
|---|---|---|
| `S3_ENDPOINT` | — | R2: `https://<account_id>.r2.cloudflarestorage.com` |
| `S3_BUCKET_NAME` | — | |
| `S3_ACCESS_KEY_ID` | — | |
| `S3_SECRET_ACCESS_KEY` | — | |
| `S3_REGION` | `auto` | |

### Observability

| Variable | Required | Default | Notes |
|---|---|---|---|
| `SENTRY_DSN` | — | — | Absent, no SDK is initialised and the app runs normally. |
| `SUPPORT_EMAIL_SENDER` | — | — | Verified SES sender address. |

### Startup behaviour

At boot the server logs one warning per optional tier that is off (S3, the Anthropic failover, `EXPO_ACCESS_TOKEN`, Sentry), so a disabled integration is visible in the platform log instead of inferred from missing behaviour.


```
Error: Config validation error:
  "DB_HOST" is required
  "AWS_COGNITO_USER_POOL_ID" is required
  "OPENAI_API_KEY" is required
```

Note the scope of that guarantee: it covers *presence of required keys at
startup*, nothing more. A key that is present but wrong still fails at use, and
optional keys are the caller's responsibility to handle — several places got
that wrong historically.

---

## Frontend (`worthygoals-frontend-app`)

Copy `worthygoals-frontend-app/.env.local.example` → `.env.local`.

All frontend vars must be prefixed `EXPO_PUBLIC_` to be bundled by Expo.

| Variable | Required | Default | Notes |
|---|---|---|---|
| `EXPO_PUBLIC_API_URL` | ✅ | — | `http://localhost:3000` on a simulator. On a physical device `localhost` is the phone — use the dev machine's LAN IP. |
| `EXPO_PUBLIC_SENTRY_DSN` | — | — | Absent, Sentry is disabled. |
| `EXPO_PUBLIC_POSTHOG_KEY` | — | — | Absent, PostHog is disabled. |

**EAS builds do not read `.env*.local`** — those files are gitignored and never
uploaded. Anything a build needs must be in the `env` block of `eas.json` or an
EAS environment variable set in project settings. A build with neither ships
with `baseURL: undefined`, and every request then fails looking like a network
problem; the app now logs explicitly when that happens.

---

## CI secrets

Set in **GitHub → repo → Settings → Secrets and variables → Actions**:

| Secret | Used by | Notes |
|---|---|---|
| `OPENAI_API_KEY` | `ci.yml` — eval harness | Optional. Without it the eval job runs `eval:dry` instead of a live run. |

There is no backend deploy workflow. The `FLY_API_TOKEN` this document used to
list was for `deploy.yml`, deleted in Jul 2026, and the Fly.io secrets section
has been removed with it. Choosing a platform and committing a deploy manifest
is tracker item E1.
