import { Controller, Get, Param } from '@nestjs/common';
import { SkiSlopesService } from './ski-slopes.service';
import { Public } from '@/modules/cms/auth/public.decorator';
import { Query } from '@nestjs/common';

@Controller('user/ski-slopes')
export class SkiSlopesController {
  constructor(private readonly slopesService: SkiSlopesService) {}

  @Public()
  @Get()
  async getByRegion(@Query('region') region: string) {
    return this.slopesService.getByRegion(region);
  }

  @Public()
  @Get('/skiing-customers')
  async getSkiingCustomers() {
    return this.slopesService.getCustomersForSkiingOrSnowboarding();
  }
}
