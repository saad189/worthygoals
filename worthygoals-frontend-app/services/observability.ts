import * as Sentry from '@sentry/react-native';

// TODO: add EXPO_PUBLIC_SENTRY_DSN and EXPO_PUBLIC_POSTHOG_KEY to .env.local
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';
const IS_PROD = process.env.NODE_ENV === 'production';

export function initSentry(routingInstrumentation?: Sentry.ReactNavigationInstrumentation) {
  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: IS_PROD && !!SENTRY_DSN,
    tracesSampleRate: 1.0,
    integrations: routingInstrumentation
      ? [Sentry.reactNavigationIntegration({ enableTimeToInitialDisplay: true })]
      : [],
  });
}

export const SentryWrap = Sentry.wrap;
