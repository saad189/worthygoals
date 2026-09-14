/**
 * Guards G6 + ECC-3 M3 together, because they had to be fixed together.
 *
 * Seven catch blocks sat after a `return somePromise` that was never awaited,
 * so they could not run — the raw error escaped to the global filter, which
 * logged it server-side and returned a generic 500. That accidental deadness
 * was the only thing preventing the leak, because the catch's intent was
 * `throw new HttpException(error.message, error.status)` and a TypeORM
 * error.message carries SQL fragments, column names and sometimes parameter
 * values.
 *
 * Adding the awaits makes those catches live, so the rethrow has to be safe
 * first.
 */
import {
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { rethrowSafe } from '../rethrow-safe';

describe('rethrowSafe', () => {
  const logger = new Logger('test');

  beforeEach(() => {
    jest.spyOn(logger, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('never leaks a database error message to the caller', () => {
    const dbError = Object.assign(
      new Error(
        'duplicate key value violates unique constraint "uq_users_email" ' +
          'DETAIL: Key (email)=(victim@example.com) already exists.',
      ),
      { code: '23505' },
    );

    try {
      rethrowSafe(dbError, logger, 'UsersService:createForAccount');
      fail('expected a throw');
    } catch (thrown) {
      expect(thrown).toBeInstanceOf(InternalServerErrorException);
      const message = JSON.stringify((thrown as HttpException).getResponse());
      expect(message).not.toContain('uq_users_email');
      expect(message).not.toContain('victim@example.com');
      expect(message).not.toContain('duplicate key');
    }
  });

  it('still logs the real error server-side', () => {
    const spy = jest.spyOn(logger, 'error');

    expect(() =>
      rethrowSafe(new Error('connection terminated'), logger, 'ctx'),
    ).toThrow();

    expect(spy.mock.calls[0][0]).toContain('connection terminated');
  });

  it('passes a deliberate HttpException through untouched', () => {
    const deliberate = new BadRequestException('User Ids must be provided.');

    try {
      rethrowSafe(deliberate, logger, 'ctx');
      fail('expected a throw');
    } catch (thrown) {
      expect(thrown).toBe(deliberate);
      expect((thrown as HttpException).getStatus()).toBe(400);
    }
  });

  it('handles a non-Error throw', () => {
    expect(() => rethrowSafe('just a string', logger, 'ctx')).toThrow(
      InternalServerErrorException,
    );
  });
});
