import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { Customer } from '../customers/customers.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, Customer]), // ✅ Ensure Repositories are registered here
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
})
export class ActivitiesModule {}
