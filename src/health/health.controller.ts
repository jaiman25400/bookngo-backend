import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { Public } from '@/modules/cms/auth/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get('user')
  getUserHealth() {
    return this.healthService.check('user');
  }

  @Public()
  @Get('cms')
  getCmsHealth() {
    return this.healthService.check('cms');
  }
}

