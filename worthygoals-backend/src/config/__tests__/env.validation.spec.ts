import { envValidationSchema } from '../env.validation';

const base = {
  NODE_ENV: 'local',
  DB_HOST: 'h',
  DB_PORT: '5432',
  DB_USERNAME: 'u',
  DB_PASSWORD: 'p',
  DB_NAME: 'n',
  AWS_REGION: 'r',
  AWS_ACCESS_KEY_ID: 'a',
  AWS_SECRET_ACCESS_KEY: 's',
  AWS_COGNITO_USER_POOL_ID: 'pool',
  AWS_COGNITO_APP_CLIENT_ID: 'client',
  OPENAI_API_KEY: 'k',
};

const validate = (env: Record<string, string | undefined>) =>
  envValidationSchema.validate(env);

describe('envValidationSchema', () => {
  it('accepts a local env and defaults REDIS_URL', () => {
    const { error, value } = validate(base);
    expect(error).toBeUndefined();
    expect(value.REDIS_URL).toBe('redis://localhost:6379');
  });

  it('fails closed when NODE_ENV is missing', () => {
    expect(validate({ ...base, NODE_ENV: undefined }).error).toBeDefined();
  });

  it('requires REDIS_URL in prod', () => {
    expect(validate({ ...base, NODE_ENV: 'prod' }).error?.message).toContain(
      'REDIS_URL',
    );
  });

  it('rejects a DB_SSL value the code would read as off', () => {
    expect(validate({ ...base, DB_SSL: '1' }).error).toBeDefined();
  });

  it('rejects malformed ALLOWED_ORIGINS', () => {
    expect(
      validate({ ...base, ALLOWED_ORIGINS: 'worthygoals.app' }).error,
    ).toBeDefined();
    expect(
      validate({
        ...base,
        ALLOWED_ORIGINS: 'https://worthygoals.app, https://www.worthygoals.app',
      }).error,
    ).toBeUndefined();
  });
});
