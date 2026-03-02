import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { Customer } from '../customers/entities/customers.entity';
import { ActivityZone } from '../activity-zones/entities/activity-zone.entity';
import { ActivitySchedule } from './entities/activity-schedule.entity';
import { ActivityHoliday } from './entities/activity-holiday.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Activity,
      Customer,
      ActivityZone,
      ActivityHoliday,
      ActivitySchedule,
    ]), // ✅ Ensure Repositories are registered here
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
})
export class ActivitiesModule {}
