import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { Customer } from '@/modules/cms/customers/entities/customers.entity';
import { CustomerDetail } from '@/modules/cms/customers/entities/customers-detail.entity';
import { CustomerUser } from '@/modules/cms/customer-users/customers-users.entity';
import { ActivityZone } from '@/modules/cms/activity-zones/entities/activity-zone.entity';
import { Activity } from '@/modules/cms/activities/entities/activity.entity';
import { ActivitySchedule } from '@/modules/cms/activities/entities/activity-schedule.entity';
import { ActivityHoliday } from '@/modules/cms/activities/entities/activity-holiday.entity';
import { Inventory } from '@/modules/cms/inventory/entities/inventory.entity';
import { InventorySize } from '@/modules/cms/inventory/entities/inventory-size.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      CustomerDetail,
      CustomerUser,
      ActivityZone,
      Activity,
      ActivitySchedule,
      ActivityHoliday,
      Inventory,
      InventorySize,
    ]),
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
