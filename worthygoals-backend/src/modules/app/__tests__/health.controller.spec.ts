/**
 * Guards E2. The only root route used to be getHello() -> 'Hello World!',
 * which touches neither Postgres nor Redis — so it reported healthy on an
 * instance that could not serve a single request. With migrationsRun: true,
 * an instance that failed to migrate at boot is exactly what readiness exists
 * to catch.
 */
import { ServiceUnavailableException } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { HealthController } from '../health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  const query = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: getDataSourceToken(), useValue: { query } as Partial<DataSource> },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  it('reports liveness without touching the database', () => {
    expect(controller.health()).toEqual({ status: 'ok' });
    expect(query).not.toHaveBeenCalled();
  });

  it('reports ready when Postgres answers', async () => {
    query.mockResolvedValue([{ '?column?': 1 }]);

    await expect(controller.ready()).resolves.toEqual({
      status: 'ok',
      postgres: 'ok',
    });
    expect(query).toHaveBeenCalledWith('SELECT 1');
  });

  it('fails readiness when Postgres is unreachable', async () => {
    query.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(controller.ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
