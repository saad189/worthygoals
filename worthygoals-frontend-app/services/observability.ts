import type * as React from 'react';
import * as Sentry from '@sentry/react-native';

// Both vendors are optional: when the env keys are absent the app must boot
// and run cleanly with no SDK initialized (decision, Jun 12 2026).
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';
const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';
const IS_PROD = process.env.NODE_ENV === 'production';

if (__DEV__) {
  const missing: string[] = [];
  if (!SENTRY_DSN)  missing.push('EXPO_PUBLIC_SENTRY_DSN');
  if (!POSTHOG_KEY) missing.push('EXPO_PUBLIC_POSTHOG_KEY');
  if (missing.length) {
    console.warn(
      '[observability] Keys not set — SDK(s) disabled:\n  ' + missing.join('\n  ') +
      '\nSee worthygoals-frontend-app/.env.local.example'
    );
  }
}

export { POSTHOG_KEY };

export function initSentry() {
  if (!SENTRY_DSN) return;
  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: IS_PROD,
    tracesSampleRate: 1.0,
  });
}

// Without a DSN, skip Sentry's wrapper entirely so the root component
// carries no dependency on an uninitialized SDK.
export const SentryWrap: <P extends Record<string, unknown>>(
  component: React.ComponentType<P>,
) => React.ComponentType<P> = SENTRY_DSN
  ? Sentry.wrap
  : (component) => component;
