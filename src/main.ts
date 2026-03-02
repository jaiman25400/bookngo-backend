import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser'; // ✅ Import cookie-parser
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './modules/cms/auth/auth.guards';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import * as express from 'express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Enable CORS
  app.enableCors({
    origin: [process.env.FRONTEND_URL, process.env.CMS_FRONTEND_URL].filter(
      Boolean,
    ), // This removes any undefined/null values
    credentials: true,
    exposedHeaders: ['Content-Type', 'Authorization'],
  });

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // ✅ Correctly resolve dependencies for JwtAuthGuard
  const reflector = app.get(Reflector);
  const jwtService = app.get(JwtService);
  app.useGlobalGuards(new JwtAuthGuard(jwtService, reflector));

  app.use(cookieParser()); // ✅ Enable cookie-parser

  const port = 3000;

  await app.listen(port);
}
void bootstrap();
