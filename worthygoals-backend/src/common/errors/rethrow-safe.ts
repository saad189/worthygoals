import {
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

/**
 * Rethrow from a service catch block without leaking internals.
 *
 * The recurring shape in this codebase was
 * `throw new HttpException(error.message, error.status)`. For a TypeORM error
 * that message is the driver's — SQL fragments, column names, sometimes
 * parameter values — and `error.status` is undefined, which also produces an
 * HttpException with an invalid status.
 *
 * Several of those catch blocks were unreachable (the try returned a promise
 * without awaiting it), so the raw error escaped to the global filter and the
 * client got a generic 500. That accidental deadness was the only thing
 * preventing the leak — so awaiting those returns and sanitising here had to
 * happen in the same change.
 *
 * An HttpException a handler raised deliberately passes through untouched.
 */
export function rethrowSafe(
  error: unknown,
  logger: Logger,
  context: string,
): never {
  if (error instanceof HttpException) throw error;

  logger.error(
    `${context}: ${error instanceof Error ? error.message : String(error)}`,
    error instanceof Error ? error.stack : undefined,
  );
  throw new InternalServerErrorException();
}
