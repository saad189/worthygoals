// Sentry is optional: only initialized when SENTRY_DSN is set (any platform's
// env/secrets mechanism). The app must boot and run cleanly without it.
import * as Sentry from '@sentry/node';
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'local',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  });
}

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './modules/app/app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Security headers
  app.use(helmet());

  // CORS: use ALLOWED_ORIGINS env var in production; allow all in development
  const rawOrigins = process.env.ALLOWED_ORIGINS;
  const allowedOrigins = rawOrigins
    ? rawOrigins.split(',').map((o) => o.trim())
    : null;
  app.enableCors({
    origin: allowedOrigins ?? (isProduction ? false : true),
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

  await app.listen(PORT, '0.0.0.0');
  console.log(`Server running on port ${PORT}`);
}
bootstrap();
