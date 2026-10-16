// MUST be first: Sentry v8 patches the libraries it instruments at init()
// time, and TS hoists every import above file-level statements — so the init
// has to live in a module of its own that is imported before anything else.
import './instrument';

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { corsOrigin } from './common/cors';
import { AppLogger, requestIdMiddleware } from './common/logging/app-logger';
import { logDisabledTiers } from './config/optional-tiers';
import helmet from 'helmet';
import { AppModule } from './modules/app/app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(new AppLogger());
  // Before everything else, so every log line of a request carries its id.
  app.use(requestIdMiddleware);
  // The deploy target (Railway) terminates TLS at one proxy. Without this,
  // req.ip is the proxy's address, so every per-IP throttle bucket collapses
  // into one shared by all users.
  app.set('trust proxy', 1);
  const PORT = process.env.PORT || 3000;
  // env.validation only permits local|lazy|dev|prod — 'production' never matches,
  // which is why Swagger was exposed in prod. The production tier is 'prod'.
  const isProduction = process.env.NODE_ENV === 'prod';

  // Security headers
  app.use(helmet());

  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation is registered once via APP_PIPE in app.module (F11).

  // Global exception filter — consistent error shape
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger: only expose in non-production
  if (!isProduction) {
    const serverUrl = `${process.env.SERVER_URL ?? 'http://localhost'}:${PORT}`;
    const options = new DocumentBuilder()
      .setTitle('Worthy Goals API')
      .setDescription('Backend Server API')
      .setVersion('1.0')
      .addBearerAuth()
      .addServer(serverUrl, 'Local environment')
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api-docs', app, document);
  }

  // Without this, a SIGTERM kills the process outright: in-flight HTTP,
  // Socket.IO connections, the TypeORM pool and BullMQ jobs all die where they
  // stand. BullMQ re-delivers a job once its lock expires, so a rolling deploy
  // could duplicate push notifications.
  app.enableShutdownHooks();

  logDisabledTiers();

  await app.listen(PORT, '0.0.0.0');
  console.log(`Server running on port ${PORT}`);
}
bootstrap().catch((error) => {
  // Without this a failed boot surfaced as an unhandled rejection warning and
  // a process that never exits non-zero — so no orchestrator would restart it.
  console.error('Failed to start the application', error);
  process.exit(1);
});
