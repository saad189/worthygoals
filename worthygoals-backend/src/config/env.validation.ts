import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // ── Server ───────────────────────────────────────────────────────────────
  NODE_ENV: Joi.string().valid('local', 'lazy', 'dev', 'prod').default('local'),
  PORT: Joi.number().default(3000),
  SERVER_URL: Joi.string().default('http://localhost'),

  // ── Database ─────────────────────────────────────────────────────────────
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // ── AWS / Cognito ─────────────────────────────────────────────────────────
  AWS_REGION: Joi.string().required(),
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),
  AWS_COGNITO_USER_POOL_ID: Joi.string().required(),
  AWS_COGNITO_APP_CLIENT_ID: Joi.string().required(),
  AWS_COGNITO_APP_CLIENT_SECRET: Joi.string().optional(),

  // ── AI ───────────────────────────────────────────────────────────────────
  OPENAI_API_KEY: Joi.string().required(),
  OPENAI_MODEL: Joi.string().default('gpt-4o-mini'),

  // ── Observability (optional — graceful no-op if absent) ──────────────────
  SENTRY_DSN: Joi.string().optional(),
  SUPPORT_EMAIL_SENDER: Joi.string().email().optional(),
}).options({
  allowUnknown: true, // don't reject OS-level env vars
  abortEarly: false, // report ALL missing keys at once, not just the first
});
