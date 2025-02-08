import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';

config(); // Load .env variables

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'jaiman123',
  database: process.env.DB_NAME || 'bookngo_db',
  entities: ['dist/**/*.entity{.ts,.js}'], // Auto-load entities
  synchronize: process.env.DB_SYNC === 'true', // Use true only in development!
  logging: process.env.DB_LOG === 'true', // Enable logging if needed
};
