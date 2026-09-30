import { Logger } from '@nestjs/common';

/**
 * One boot line per optional integration that is switched off.
 *
 * These tiers degrade to a no-op when their env is absent — correct for local
 * dev, invisible in production. Media upload, the Anthropic failover and error
 * reporting could all be silently off with nothing at startup saying so.
 */
export function logDisabledTiers(env = process.env): void {
  const logger = new Logger('Config');
  const off: Array<[boolean, string]> = [
    [
      !(env.S3_BUCKET_NAME && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY),
      'S3_* not set — photo upload and memory pictures are disabled',
    ],
    [
      !env.ANTHROPIC_API_KEY,
      'ANTHROPIC_API_KEY not set — no AI failover provider',
    ],
    [
      !env.EXPO_ACCESS_TOKEN,
      'EXPO_ACCESS_TOKEN not set — push works only while Expo enhanced security is off',
    ],
    [!env.SENTRY_DSN, 'SENTRY_DSN not set — server errors are not reported'],
  ];
  for (const [disabled, message] of off) {
    if (disabled) logger.warn(message);
  }
}
