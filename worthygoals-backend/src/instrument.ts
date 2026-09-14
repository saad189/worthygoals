/**
 * Sentry initialisation, in its own module imported first by main.ts.
 *
 * @sentry/node v8 patches the libraries it instruments at init() time, so it
 * has to run before anything else is imported. Doing it inline in main.ts did
 * not achieve that: TypeScript hoists every `import` above the statements in
 * the file, so Nest, Express and the AppModule were all required before the
 * `if (SENTRY_DSN)` block ran, and the auto-instrumentation had nothing left
 * to patch. A separate module imported on the first line is the supported
 * pattern.
 *
 * Sentry stays optional — with no DSN the app boots and runs with no SDK
 * initialised.
 */
import * as Sentry from '@sentry/node';

export const SENTRY_ENABLED = Boolean(process.env.SENTRY_DSN);

if (SENTRY_ENABLED) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'local',
    tracesSampleRate: process.env.NODE_ENV === 'prod' ? 0.2 : 1.0,
  });
}
