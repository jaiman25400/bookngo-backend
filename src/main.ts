import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config'; // Import ConfigService
import * as cookieParser from 'cookie-parser'; // ✅ Import cookie-parser
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Enable CORS
  app.enableCors({
    origin: 'http://localhost:3001', // Allow frontend to make requests
    credentials: true, // Allow cookies and authentication headers
  });

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically transform payloads to DTO instances
      whitelist: true, // Strip properties that are not in the DTO
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are found
    }),
  );

  app.use(cookieParser()); // ✅ Enable cookie-parser

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3000; // Use ConfigService to get the port

  await app.listen(port);
}
bootstrap();
