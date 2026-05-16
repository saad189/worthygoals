import * as Sentry from '@sentry/react-native';

// TODO: add EXPO_PUBLIC_SENTRY_DSN and EXPO_PUBLIC_POSTHOG_KEY to .env.local
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
  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: IS_PROD && !!SENTRY_DSN,
    tracesSampleRate: 1.0,
  });
}

export const SentryWrap = Sentry.wrap;
