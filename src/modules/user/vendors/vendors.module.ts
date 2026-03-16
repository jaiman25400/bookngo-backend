import { Module } from '@nestjs/common';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { CustomerDetail } from '../../cms/customers/entities/customers-detail.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from '../../cms/activities/entities/activity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerDetail, Activity])],
  controllers: [VendorsController],
  providers: [VendorsService],
})
export class VendorsModule {}
