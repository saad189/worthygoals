import { randomUUID } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';
import { ConsoleLogger, LogLevel } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const requestContext = new AsyncLocalStorage<{ requestId: string }>();

export const currentRequestId = () => requestContext.getStore()?.requestId;

/**
 * Give every HTTP request an id, echo it back as X-Request-Id, and make it
 * available to every log line written while handling that request. A trusted
 * upstream id (the platform proxy's) is reused if it looks like one.
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.header('x-request-id');
  const requestId =
    incoming && /^[\w-]{1,64}$/.test(incoming) ? incoming : randomUUID();
  res.setHeader('x-request-id', requestId);
  requestContext.run({ requestId }, next);
}

/**
 * Nest's logger with the request id attached, and one JSON object per line in
 * production so a hosted log viewer can group the lines of one failed request.
 * Pretty text everywhere else — on a laptop that is still the right choice.
 */
export class AppLogger extends ConsoleLogger {
  private readonly json = process.env.NODE_ENV === 'prod';

  protected printMessages(
    messages: unknown[],
    context = '',
    logLevel: LogLevel = 'log',
    writeStreamType?: 'stdout' | 'stderr',
  ): void {
    const requestId = currentRequestId();
    if (!this.json) {
      const ctx = requestId ? `${context} ${requestId.slice(0, 8)}` : context;
      return super.printMessages(messages, ctx, logLevel, writeStreamType);
    }
    const stream =
      (writeStreamType ?? (logLevel === 'error' ? 'stderr' : 'stdout')) ===
      'stderr'
        ? process.stderr
        : process.stdout;
    for (const message of messages) {
      stream.write(
        JSON.stringify({
          time: new Date().toISOString(),
          level: logLevel,
          context: context || undefined,
          requestId,
          message: message instanceof Error ? message.message : message,
        }) + '\n',
      );
    }
  }

  protected printStackTrace(stack: string): void {
    if (!this.json) return super.printStackTrace(stack);
    if (!stack) return;
    process.stderr.write(
      JSON.stringify({
        time: new Date().toISOString(),
        level: 'error',
        requestId: currentRequestId(),
        stack,
      }) + '\n',
    );
  }
}
