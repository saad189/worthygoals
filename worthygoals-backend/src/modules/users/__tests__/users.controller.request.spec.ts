/**
 * The first request-level spec in the backend.
 *
 * Every other suite here calls service methods against mocked repositories, so
 * none of them applies the global ValidationPipe — which is why `POST /users`
 * shipped with its @Body() typed `Partial<CreateUserDto>`. A Partial erases to
 * `Object` in the emitted `design:paramtypes`, the pipe skips any route whose
 * metatype is `Object`, and the body reached `userRepository.create(dto)`
 * whole. `{"isAdmin":true}` self-granted the Admin role (getRole reads
 * user.isAdmin); `{"id":42}` rebound another user's row to the attacker's
 * Cognito account; `{"tier":"paid"}` set the billing tier.
 *
 * These assertions only hold while the handler takes a concrete DTO class, so
 * this spec fails if anyone reintroduces a Partial or an untyped body.
 */
import { ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { GLOBAL_VALIDATION_PIPE_OPTIONS } from 'src/common/validation-pipe.options';
import { JwtAuthGuard } from 'src/common/guards';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { GdprService } from '../gdpr.service';

const ATTACKER_SUB = 'cognito-sub-attacker';

const VALID_BODY = {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
};

describe('POST /users (request level)', () => {
  let app: INestApplication;
  const createForAccount = jest.fn();

  beforeEach(async () => {
    createForAccount.mockReset().mockResolvedValue({ id: 1, ...VALID_BODY });

    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: { createForAccount } },
        { provide: GdprService, useValue: {} },
        // The real global pipe, from the same options object AppModule uses.
        {
          provide: APP_PIPE,
          useValue: new ValidationPipe(GLOBAL_VALIDATION_PIPE_OPTIONS),
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: any) => {
          ctx.switchToHttp().getRequest().user = { sub: ATTACKER_SUB };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('accepts a valid body and forwards only declared fields', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send(VALID_BODY)
      .expect(201);

    expect(createForAccount).toHaveBeenCalledWith({
      accountSub: ATTACKER_SUB,
      dto: VALID_BODY,
    });
  });

  it.each([
    ['a privilege column', { isAdmin: true }],
    ['a primary key', { id: 42 }],
    ['a billing column', { tier: 'paid' }],
    ['an undeclared column', { role: 'admin' }],
  ])(
    'rejects %s with 400 and never reaches the service',
    async (_label, injected) => {
      await request(app.getHttpServer())
        .post('/users')
        .send({ ...VALID_BODY, ...injected })
        .expect(400);

      expect(createForAccount).not.toHaveBeenCalled();
    },
  );

  it('rejects a malformed email', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({ ...VALID_BODY, email: 'not-an-email' })
      .expect(400);

    expect(createForAccount).not.toHaveBeenCalled();
  });

  it('rejects a tone outside the allowed set', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({ ...VALID_BODY, tone: 'shouty' })
      .expect(400);

    expect(createForAccount).not.toHaveBeenCalled();
  });
});
