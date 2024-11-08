import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = process.env.PORT || 3000;
  const serverUrl = `${process.env.SERVER_URL}:${PORT}`;


  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,

  })

  const options = new DocumentBuilder()
    .setTitle('Worthy Goals API')
    .setDescription('Backend Server API')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer(serverUrl, 'Local environment')
    // .addServer('https://staging.yourapi.com/', 'Staging')
    //  .addServer('https://production.yourapi.com/', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, document);
  await app.listen(PORT, '0.0.0.0');
  console.log(`Server running on port ${PORT}`);
}
bootstrap();