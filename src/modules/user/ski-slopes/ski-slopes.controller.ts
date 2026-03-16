import { Controller, Get, Query } from '@nestjs/common';
import { SkiSlopesService } from './ski-slopes.service';
import { Public } from '../../cms/auth/public.decorator';
import { ActivityType } from '../../cms/activities/enums/activity-type.enum';

@Controller('user/ski-slopes')
export class SkiSlopesController {
  constructor(private readonly slopesService: SkiSlopesService) {}

  @Public()
  @Get()
  async getByRegion(
    @Query('region') region: string,
    @Query('activityType') activityType?: ActivityType,
  ) {
    return this.slopesService.getByRegion(region, activityType);
  }

  @Public()
  @Get('/skiing-customers')
  async getSkiingCustomers() {
    return this.slopesService.getCustomersForSkiingOrSnowboarding();
  }

  @Public()
  @Get('/ice-skating-customers')
  async getIceSkatingCustomers() {
    return this.slopesService.getCustomersForIceSkating();
  }
}
