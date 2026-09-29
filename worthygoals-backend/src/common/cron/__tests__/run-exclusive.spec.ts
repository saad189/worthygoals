import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { runExclusive } from '../run-exclusive';

const makeDataSource = (locked: boolean) => {
  const runner = {
    connect: jest.fn(),
    release: jest.fn(),
    query: jest.fn((sql: string) =>
      Promise.resolve(sql.includes('pg_try_advisory_lock') ? [{ locked }] : []),
    ),
  };
  return {
    runner,
    dataSource: { createQueryRunner: () => runner } as unknown as DataSource,
  };
};

const logger = { debug: jest.fn() } as unknown as Logger;

describe('runExclusive', () => {
  it('runs the body and releases the lock when it wins', async () => {
    const { runner, dataSource } = makeDataSource(true);
    const fn = jest.fn().mockResolvedValue(undefined);

    await runExclusive(dataSource, 1, logger, fn);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(runner.query).toHaveBeenCalledWith('SELECT pg_advisory_unlock($1)', [
      1,
    ]);
    expect(runner.release).toHaveBeenCalled();
  });

  it('skips the body when another replica holds the lock', async () => {
    const { runner, dataSource } = makeDataSource(false);
    const fn = jest.fn();

    await runExclusive(dataSource, 1, logger, fn);

    expect(fn).not.toHaveBeenCalled();
    expect(runner.release).toHaveBeenCalled();
  });

  it('unlocks even when the body throws', async () => {
    const { runner, dataSource } = makeDataSource(true);

    await expect(
      runExclusive(dataSource, 1, logger, () =>
        Promise.reject(new Error('boom')),
      ),
    ).rejects.toThrow('boom');
    expect(runner.query).toHaveBeenCalledWith('SELECT pg_advisory_unlock($1)', [
      1,
    ]);
    expect(runner.release).toHaveBeenCalled();
  });
});
