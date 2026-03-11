import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './commons/interceptors/response.interceptor';
import { LoggerMiddleware } from './middlewares/logger.middleware';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const swagger = new DocumentBuilder()
    .setTitle('WDP Eyewear Admin API')
    .setDescription(
      'Admin and backend API for WDP Eyewear platform. ' +
        'Manages products, variants, media uploads, inventory, policies, users, and orders.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication and user session management')
    .addTag('Users', 'User management and profile operations')
    .addTag('Products', 'Product and variant CRUD operations')
    .addTag('Media', 'Upload 2D images and 3D models')
    .addTag('Inventory', 'Stock management per SKU')
    .addTag('Policies', 'Company policies (return, refund, shipping, etc.)')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('api', app, documentFactory);

  const loggerMiddleware = new LoggerMiddleware();
  app.use((req: Request, res: Response, next: NextFunction) =>
    loggerMiddleware.use(req, res, next),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.listen(process.env.PORT ?? 8386);
}
void bootstrap();
