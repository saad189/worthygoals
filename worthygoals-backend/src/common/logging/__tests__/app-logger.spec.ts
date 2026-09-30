import type { Request, Response } from 'express';
import { AppLogger, requestIdMiddleware } from '../app-logger';

const run = (incoming: string | undefined, fn: () => void) => {
  const headers: Record<string, string> = {};
  const req = { header: () => incoming } as unknown as Request;
  const res = {
    setHeader: (k: string, v: string) => (headers[k] = v),
  } as unknown as Response;
  requestIdMiddleware(req, res, fn);
  return headers['x-request-id'];
};

describe('AppLogger', () => {
  const env = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = env;
    jest.restoreAllMocks();
  });

  it('writes one JSON line carrying the request id in prod', () => {
    process.env.NODE_ENV = 'prod';
    const write = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    const logger = new AppLogger();

    const id = run(undefined, () => logger.log('hello', 'Ctx'));

    const line = JSON.parse(String(write.mock.calls[0][0]));
    expect(line).toMatchObject({
      level: 'log',
      context: 'Ctx',
      message: 'hello',
      requestId: id,
    });
  });

  it('reuses a well-formed upstream id and replaces a malformed one', () => {
    expect(run('abc-123', () => undefined)).toBe('abc-123');
    expect(run('bad id\n', () => undefined)).not.toBe('bad id\n');
  });
});
