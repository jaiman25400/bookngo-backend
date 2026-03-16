import { config as loadEnv } from 'dotenv';
loadEnv();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './modules/cms/auth/auth.guards';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import * as express from 'express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Client, type ClientConfig } from 'pg';

const CMS_SCHEMA = 'BookNGo_CMS';
const USERS_SCHEMA = 'BookNGo_Users';

/** Create PostgreSQL schemas if they don't exist (e.g. on fresh Neon/Render DB). */
async function ensureSchemas(): Promise<void> {
  const connectionUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const config: ClientConfig = connectionUrl
    ? { connectionString: connectionUrl, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASS ?? '',
        database: process.env.DB_NAME || 'bookngo_db',
      };
  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- pg Client types are correct at runtime */
  const client = new Client(config);
  try {
    await client.connect();
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${CMS_SCHEMA}"`);
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${USERS_SCHEMA}"`);
  } finally {
    await client.end();
  }
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
}

async function bootstrap() {
  await ensureSchemas();

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

  /* eslint-disable-next-line @typescript-eslint/no-unsafe-call -- cookie-parser middleware is valid */
  app.use(cookieParser());

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  await app.listen(port);
}
void bootstrap();
