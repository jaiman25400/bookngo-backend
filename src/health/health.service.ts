import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  async check(target: 'user' | 'cms') {
    let db = 'down';
    try {
      await this.dataSource.query('SELECT 1');
      db = 'up';
    } catch {
      db = 'down';
    }

    return {
      status: 'ok',
      target,
      db,
      timestamp: new Date().toISOString(),
    };
  }
}

