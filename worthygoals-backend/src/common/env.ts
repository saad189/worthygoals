/**
 * Read an environment variable that config validation guarantees is present.
 *
 * `src/config/env.validation.ts` marks these `Joi.string().required()`, so the
 * app cannot boot without them — but `process.env` is typed
 * `string | undefined`, and under strictNullChecks every read is an error.
 *
 * The alternative is a non-null assertion at each site, which silences the
 * compiler and turns a misconfiguration into `undefined` flowing into an SDK.
 * This fails immediately and says which variable is missing.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Required environment variable ${name} is not set. See docs/ENV.md.`,
    );
  }
  return value;
}
