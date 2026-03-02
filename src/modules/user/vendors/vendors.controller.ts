import { Controller, Get, Param, Query } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { Public } from '@/modules/cms/auth/public.decorator';

@Controller('user/vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Public()
  @Get('customerSlug')
  async getByRegion(@Query('slug') customerSlug: string) {
    return this.vendorsService.getVendorAllActivitiesByVendorSlug(customerSlug);
  }

  @Public()
  @Get('activity/:id')
  async getVendorActivityByID(@Param('id') id: number) {
    return this.vendorsService.getVendorActivityByID(id);
  }
}
