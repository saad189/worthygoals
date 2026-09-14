import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') return;

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const rawStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Guard against malformed HttpExceptions (e.g. `new HttpException(msg,
    // error.status)` where a raw DB/driver error has no `.status`). An invalid
    // status code makes `res.status(...)` throw ERR_HTTP_INVALID_STATUS_CODE,
    // which crashes the response and surfaces to clients as a dropped
    // connection rather than a clean error.
    const status =
      Number.isInteger(rawStatus) && rawStatus >= 100 && rawStatus <= 599
        ? rawStatus
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // This filter catches everything, so nothing ever reaches Express's error
    // middleware and Sentry's auto-instrumentation never saw a single server
    // error — Sentry.init in main.ts was the only Sentry call in the backend.
    // Report here, which is the one place every unhandled error passes through.
    if (!(exception instanceof HttpException)) {
      this.logger.error(
        'Unhandled exception',
        exception instanceof Error ? exception.stack : String(exception),
      );
      this.report(exception, request, status);
    } else if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      // 4xx are the client's problem and would drown the signal; 5xx are ours.
      this.report(exception, request, status);
    }

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const body =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? exceptionResponse
        : { message: exceptionResponse ?? 'Internal server error' };

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...body,
    });
  }

  /** Never let error reporting become a source of errors. */
  private report(exception: unknown, request: Request, status: number): void {
    try {
      Sentry.captureException(exception, {
        tags: { path: request.route?.path ?? request.url, status },
        extra: { method: request.method, url: request.url },
      });
    } catch (err) {
      this.logger.warn(`Failed to report exception to Sentry: ${err}`);
    }
  }
}
