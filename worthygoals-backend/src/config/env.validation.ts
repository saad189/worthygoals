import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // ── Server ───────────────────────────────────────────────────────────────
  // Required, no default. Defaulting to 'local' was the fail-open direction:
  // a host that forgot to set it served Swagger and reflected any CORS origin.
  NODE_ENV: Joi.string().valid('local', 'lazy', 'dev', 'prod').required(),
  PORT: Joi.number().default(3000),
  SERVER_URL: Joi.string().default('http://localhost'),
  // Comma-separated browser origins. Unset in prod means none are allowed —
  // the native app sends no Origin and is unaffected.
  ALLOWED_ORIGINS: Joi.string()
    .pattern(/^https?:\/\/[^,\s]+(\s*,\s*https?:\/\/[^,\s]+)*$/)
    .optional()
    .messages({
      'string.pattern.base':
        'ALLOWED_ORIGINS must be comma-separated http(s) origins',
    }),

  // ── Database (PostgreSQL + pgvector) ─────────────────────────────────────
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  // These were read straight off process.env, so DB_SSL=1 silently meant "no
  // TLS". Only the literal strings the code compares against are accepted.
  DB_SSL: Joi.string().valid('true', 'false').optional(),
  DB_SSL_REJECT_UNAUTHORIZED: Joi.string().valid('true', 'false').optional(),
  DB_LOGGING: Joi.string().valid('true', 'false').optional(),
  DB_POOL_MAX: Joi.number().integer().min(1).optional(),

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
  EMBEDDING_MODEL: Joi.string().default('text-embedding-3-small'),
  ANTHROPIC_API_KEY: Joi.string().optional(), // Tier 2: graceful no-op if absent
  AI_ACTIVE_PROVIDER: Joi.string()
    .valid('openai', 'anthropic')
    .default('openai'),
  // JSON map of model → { in, out } cost per million tokens. Falls back to
  // hard-coded defaults when absent. Allows price updates without a redeploy.
  AI_MODEL_COSTS_JSON: Joi.string().optional(),

  // ── S3 / R2 media storage (optional — graceful no-op if absent) ──────────
  S3_ENDPOINT: Joi.string().optional(), // R2: https://<account_id>.r2.cloudflarestorage.com
  S3_BUCKET_NAME: Joi.string().optional(),
  S3_ACCESS_KEY_ID: Joi.string().optional(),
  S3_SECRET_ACCESS_KEY: Joi.string().optional(),
  S3_REGION: Joi.string().default('auto'),

  // ── Push Notifications ───────────────────────────────────────────────────
  // Required in prod: the localhost default let an instance with no Redis
  // pass validation, boot clean, and queue every push into a dead connection.
  REDIS_URL: Joi.string().when('NODE_ENV', {
    is: 'prod',
    then: Joi.required(),
    otherwise: Joi.optional().default('redis://localhost:6379'),
  }),
  EXPO_ACCESS_TOKEN: Joi.string().optional(), // Tier 2: graceful no-op if absent

  // ── Observability (optional — graceful no-op if absent) ──────────────────
  SENTRY_DSN: Joi.string().allow('').optional(),
  SUPPORT_EMAIL_SENDER: Joi.string().email().optional(),
}).options({
  allowUnknown: true, // don't reject OS-level env vars
  abortEarly: false, // report ALL missing keys at once, not just the first
});
