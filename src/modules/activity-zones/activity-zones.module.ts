import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityZonesService } from './activity-zones.service';
import { ActivityZonesController } from './activity-zones.controller';
import { ActivityZone } from './entities/activity-zone.entity';
import { Customer } from '../customers/entities/customers.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityZone, Customer]), AuthModule], // Include entities here
  controllers: [ActivityZonesController],
  providers: [ActivityZonesService],
})
export class ActivityZonesModule {}
