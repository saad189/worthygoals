import { ValidationPipeOptions } from '@nestjs/common';

/**
 * Options for the single global ValidationPipe (registered via APP_PIPE in
 * AppModule). Lives in its own file so request-level specs can mount the real
 * pipe rather than a copy that can drift from it.
 *
 * `whitelist` + `forbidNonWhitelisted` are what stop a client setting columns
 * the DTO never declared — `id`, `isAdmin`, `tier`. They only apply when the
 * handler's @Body() is typed as a concrete DTO class: a `Partial<T>` erases to
 * `Object` in the emitted metadata and the pipe skips the route entirely.
 */
export const GLOBAL_VALIDATION_PIPE_OPTIONS: ValidationPipeOptions = {
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
};
