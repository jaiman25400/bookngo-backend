import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config'; // Import ConfigService
import * as cookieParser from 'cookie-parser'; // ✅ Import cookie-parser
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './modules/auth/auth.guards';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // ✅ Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically transform payloads to DTO instances
      whitelist: true, // Strip properties that are not in the DTO
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are found
    }),
  );
  // ✅ Correctly resolve dependencies for JwtAuthGuard
  const reflector = app.get(Reflector);
  const jwtService = app.get(JwtService);
  app.useGlobalGuards(new JwtAuthGuard(jwtService, reflector));

  app.use(cookieParser()); // ✅ Enable cookie-parser

  const port = configService.get('PORT') || 3000; // Use ConfigService to get the port

  await app.listen(port);
}
bootstrap();
