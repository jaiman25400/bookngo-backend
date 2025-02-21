// src/activities/activities.controller.ts
import { Controller, Post, Body, Get, Headers } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { Activity } from './entities/activity.entity';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  async getActivities(@Headers('Customer-ID') customerId: number) {
    const activities =
      await this.activitiesService.getActivitiesForCustomer(customerId);
    return activities;
  }

  @Post('add')
  async createActivity(
    @Body() createActivityDto: CreateActivityDto,
  ): Promise<Activity> {
    return this.activitiesService.createActivity(createActivityDto);
  }
}
