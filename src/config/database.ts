import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';

config(); // Load .env variables

/** Connection URL: prefer DATABASE_URL, then POSTGRES_URL (Vercel/Neon), else use DB_* vars. */
const connectionUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

/** Build TypeORM config: use connection URL if set (e.g. Neon on Vercel), else DB_* vars. */
export const databaseConfig: TypeOrmModuleOptions = connectionUrl
  ? {
      type: 'postgres',
      url: connectionUrl,
      entities: ['dist/**/*.entity{.ts,.js}'],
      synchronize: process.env.DB_SYNC === 'true',
      logging: process.env.DB_LOG === 'true',
      ssl: { rejectUnauthorized: false },
    }
  : {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'jaiman123',
      database: process.env.DB_NAME || 'bookngo_db',
      entities: ['dist/**/*.entity{.ts,.js}'],
      synchronize: process.env.DB_SYNC === 'true',
      logging: process.env.DB_LOG === 'true',
    };
