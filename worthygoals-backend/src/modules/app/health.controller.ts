import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Liveness and readiness probes.
 *
 * There were none — no /health, no /healthz, no /ready, and no HEALTHCHECK in
 * the Dockerfile. The only root route was getHello() returning 'Hello World!',
 * which touches neither Postgres nor Redis and so reports healthy on an
 * instance that cannot serve a single request.
 *
 * That matters most with migrationsRun: true — an instance that failed to
 * migrate at boot is precisely what a readiness probe exists to catch.
 *
 * ponytail: readiness checks Postgres only. It is what gates the boot
 * migrations and every read and write; with Redis down the API still serves
 * and BullMQ jobs simply queue. Add a Redis ping here if queue latency ever
 * needs to fail a deploy — it needs the queue's connection injected, which
 * means registering the queue in this module.
 */
@ApiExcludeController()
@Controller()
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /** Liveness: the process is up. Deliberately touches nothing. */
  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  /** Readiness: this instance can actually serve traffic. */
  @Get('ready')
  async ready(): Promise<{ status: string; postgres: string }> {
    try {
      await this.dataSource.query('SELECT 1');
    } catch (error: any) {
      throw new ServiceUnavailableException({
        status: 'error',
        postgres: `unreachable: ${error?.message ?? 'unknown error'}`,
      });
    }

    return { status: 'ok', postgres: 'ok' };
  }
}
