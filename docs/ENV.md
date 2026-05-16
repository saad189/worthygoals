# Environment Variables & Secrets

This document is the single source of truth for every env var and secret used in Worthy Goals. Copy the relevant `.env.local.example` files to get started.

---

## Backend (`worthygoals-backend`)

Copy `worthygoals-backend/.env.local.example` → `.env.local`

The backend validates **all required keys at startup** via Joi (`src/config/env.validation.ts`). If a required key is missing, the process exits immediately with a clear list of what's wrong — no silent failures at runtime.

| Variable | Required | Default | Where to get it |
|---|---|---|---|
| `NODE_ENV` | — | `local` | Set automatically by npm scripts |
| `PORT` | — | `3000` | — |
| `SERVER_URL` | — | `http://localhost` | Your deployment URL in staging/prod |
| `DB_HOST` | ✅ | — | Your MySQL host (e.g. `127.0.0.1`) |
| `DB_PORT` | ✅ | — | Usually `3306` |
| `DB_USERNAME` | ✅ | — | Your MySQL user |
| `DB_PASSWORD` | ✅ | — | Your MySQL password |
| `DB_NAME` | ✅ | — | e.g. `worthygoals` |
| `AWS_REGION` | ✅ | — | Your Cognito region (e.g. `eu-north-1`) |
| `AWS_ACCESS_KEY_ID` | ✅ | — | IAM key with Cognito + SES permissions |
| `AWS_SECRET_ACCESS_KEY` | ✅ | — | IAM secret |
| `AWS_COGNITO_USER_POOL_ID` | ✅ | — | Cognito → User Pools → Pool ID |
| `AWS_COGNITO_APP_CLIENT_ID` | ✅ | — | Cognito → App clients → Client ID |
| `AWS_COGNITO_APP_CLIENT_SECRET` | — | — | Cognito → App clients → Client secret (if enabled) |
| `OPENAI_API_KEY` | ✅ | — | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `OPENAI_MODEL` | — | `gpt-4o-mini` | Override for a different default model |
| `SENTRY_DSN` | — | — | Sentry → Project → Settings → Client Keys. If absent, Sentry is silently disabled. |
| `SUPPORT_EMAIL_SENDER` | — | `support@glotte.org` | Verified SES sender address |

### Startup behaviour

```
# Missing required keys → process exits with a clear list:
Error: Config validation error:
  "DB_HOST" is required
  "AWS_COGNITO_USER_POOL_ID" is required
  "OPENAI_API_KEY" is required
```

---

## Frontend (`worthygoals-frontend-app`)

Copy `worthygoals-frontend-app/.env.local.example` → `.env.local`

All frontend env vars must be prefixed `EXPO_PUBLIC_` to be bundled by Expo. Missing optional keys log a **dev-mode warning** but never crash the app.

| Variable | Required | Default | Where to get it |
|---|---|---|---|
| `EXPO_PUBLIC_API_URL` | ✅ | — | `http://localhost:3000` for local, staging/prod URL otherwise |
| `EXPO_PUBLIC_SENTRY_DSN` | — | — | Sentry → Project → Settings → Client Keys. If absent, Sentry disabled. |
| `EXPO_PUBLIC_POSTHOG_KEY` | — | — | PostHog → Project Settings → Project API key. If absent, PostHog disabled. |

### Dev-mode warning (missing optional keys)

```
[observability] Keys not set — SDK(s) disabled:
  EXPO_PUBLIC_SENTRY_DSN
  EXPO_PUBLIC_POSTHOG_KEY
See worthygoals-frontend-app/.env.local.example
```

---

## GitHub Actions Secrets

Set these in **GitHub → repo → Settings → Secrets and variables → Actions**:

| Secret | Used by | How to get it |
|---|---|---|
| `FLY_API_TOKEN` | `deploy.yml` — Fly.io auto-deploy | `fly auth token` after `fly auth login` |

---

## Fly.io Secrets (backend production env)

Set via `fly secrets set KEY=value` inside `worthygoals-backend/`:

```bash
fly secrets set \
  DB_HOST=... \
  DB_PORT=3306 \
  DB_USERNAME=... \
  DB_PASSWORD=... \
  DB_NAME=worthygoals \
  AWS_REGION=... \
  AWS_ACCESS_KEY_ID=... \
  AWS_SECRET_ACCESS_KEY=... \
  AWS_COGNITO_USER_POOL_ID=... \
  AWS_COGNITO_APP_CLIENT_ID=... \
  OPENAI_API_KEY=... \
  SENTRY_DSN=...
```

---

## Error handling policy

| Tier | Key type | Behaviour if missing |
|---|---|---|
| **Hard fail** | DB, AWS Cognito, OpenAI | Backend exits at startup with a named error. No silent failures. |
| **Graceful no-op** | Sentry DSN, PostHog key | SDKs initialise as disabled. App runs normally. Dev logs a warning. |
| **Default provided** | PORT, NODE_ENV, OPENAI_MODEL, SERVER_URL | Falls back to the documented default. |
