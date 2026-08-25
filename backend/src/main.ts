import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export async function createApp() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet());
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('InfoPark API')
    .setDescription(
      'API interna de gestión de activos. Autenticación JWT. Solo ADMIN puede crear/editar usuarios.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'JWT',
    )
    .addTag('auth', 'Login (público)')
    .addTag('users', 'Gestión de usuarios (solo ADMIN)')
    .addTag('assets', 'CRUD de activos')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // Only expose Swagger in development
  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('api/docs', app, document);
  }

  const allowedOrigins = configService
    .get<string>('CORS_ORIGINS', 'http://localhost:3000')
    .split(',');
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = configService.get<number>('PORT', 4000);
  await app.init();
  return { app, port };
}

async function bootstrap() {
  const { app, port } = await createApp();
  const logger = new Logger('Bootstrap');
  await app.listen(port);
  logger.log(`Application running on port ${port}`);
}

if (process.env.VERCEL !== '1') {
  void bootstrap();
}
