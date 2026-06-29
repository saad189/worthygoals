import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

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

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        'Unhandled exception',
        exception instanceof Error ? exception.stack : String(exception),
      );
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
}
