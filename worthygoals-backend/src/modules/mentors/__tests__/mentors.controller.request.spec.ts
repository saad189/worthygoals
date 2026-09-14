/**
 * Guards B2 at the HTTP boundary.
 *
 * MentorsController used to expose POST / PATCH / DELETE under JwtAuthGuard
 * alone. `mentors` is the one table with no userId and no RolesGuard exists in
 * this codebase, so any authenticated user could rewrite or delete every
 * mentor's system prompt. The read side returned the raw entity, so the same
 * user could also just read every prompt — via GET /mentors and again via
 * GET /conversations?include=mentor.
 *
 * Unit tests against a mocked repository cannot see either half: the write
 * routes looked like ordinary handlers and the leak only exists once a
 * response is serialized.
 */
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { APP_PIPE, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { GLOBAL_VALIDATION_PIPE_OPTIONS } from 'src/common/validation-pipe.options';
import { JwtAuthGuard } from 'src/common/guards';
import { Mentor } from 'src/database/models';
import { MentorsController } from '../mentors.controller';
import { MentorsService } from '../mentors.service';

const SECRET_FIELDS = [
  'promptBlocks',
  'personalityTraits',
  'topicPolicy',
  'safetyPolicy',
  'memoryPolicy',
  'modelConfig',
];

// A real Mentor instance: @Exclude only applies to class instances, so a plain
// object literal would serialize whole and the test would pass vacuously.
function buildMentor(): Mentor {
  return Object.assign(new Mentor(), {
    id: 1,
    slug: 'marcus',
    name: 'Marcus',
    title: 'The Stoic',
    shortDescription: 'Calm and direct.',
    avatarUrl: 'https://example.test/marcus.png',
    isActive: true,
    promptBlocks: { system: 'TOP SECRET SYSTEM PROMPT' },
    personalityTraits: { warmth: 2 },
    topicPolicy: { banned: ['x'] },
    safetyPolicy: { escalate: true },
    memoryPolicy: { window: 10 },
    modelConfig: { model: 'gpt-4o', maxTokens: 900 },
  });
}

describe('/mentors (request level)', () => {
  let app: INestApplication;
  const findAll = jest.fn();
  const findOne = jest.fn();

  beforeEach(async () => {
    findAll.mockReset().mockResolvedValue([buildMentor()]);
    findOne.mockReset().mockResolvedValue(buildMentor());

    const moduleRef = await Test.createTestingModule({
      controllers: [MentorsController],
      providers: [
        { provide: MentorsService, useValue: { findAll, findOne } },
        { provide: APP_PIPE, useValue: new ValidationPipe(GLOBAL_VALIDATION_PIPE_OPTIONS) },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    // The controller carries @UseInterceptors(ClassSerializerInterceptor), but
    // it needs a Reflector that a bare testing module does not wire up.
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it.each([
    ['GET /mentors', '/mentors'],
    ['GET /mentors/1', '/mentors/1'],
  ])('%s never returns the system prompt or any policy block', async (_label, url) => {
    const res = await request(app.getHttpServer()).get(url).expect(200);
    const body = JSON.stringify(res.body);

    for (const field of SECRET_FIELDS) {
      expect(body).not.toContain(field);
    }
    expect(body).not.toContain('TOP SECRET SYSTEM PROMPT');
  });

  it('still returns the catalog fields the app renders', async () => {
    const res = await request(app.getHttpServer()).get('/mentors').expect(200);

    expect(res.body[0]).toMatchObject({
      id: 1,
      slug: 'marcus',
      name: 'Marcus',
      title: 'The Stoic',
      shortDescription: 'Calm and direct.',
      avatarUrl: 'https://example.test/marcus.png',
    });
  });

  it.each([
    ['post', '/mentors'],
    ['patch', '/mentors/1'],
    ['delete', '/mentors/1'],
  ])('%s %s is not routed — mentors are catalog data', async (method, url) => {
    await request(app.getHttpServer())
      [method](url)
      .send({ promptBlocks: { system: 'pwned' } })
      .expect(404);
  });
});
