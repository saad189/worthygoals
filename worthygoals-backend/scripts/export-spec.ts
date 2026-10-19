import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
// The compiled app, not src: the @nestjs/swagger CLI plugin (nest-cli.json)
// documents DTOs, entities and response types at build time, and ts-node
// compiles without it — which is why most responses had no schema.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { AppModule } = require('../dist/modules/app/app.module');
import { writeFileSync } from 'fs';
import { resolve } from 'path';

async function exportSpec() {
  const app = await NestFactory.create(AppModule, {
    logger: false,
    preview: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Worthy Goals API')
    .setDescription('Backend Server API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const outPath = resolve(__dirname, '../openapi.json');
  writeFileSync(outPath, JSON.stringify(document, null, 2));
  console.log(`OpenAPI spec written to ${outPath}`);
  await app.close();
}

exportSpec().catch((err) => {
  console.error(err);
  process.exit(1);
});
