// src/activities/activities.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Request,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { Activity } from './entities/activity.entity';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  async getActivities(@Request() req) {
    const activities = await this.activitiesService.getActivitiesForCustomer(
      req.user?.customer,
    );
    return activities;
  }

  @Post('add')
  async createActivity(
    @Body() createActivityDto: CreateActivityDto,
    @Request() req,
  ): Promise<Activity> {
    console.log('Create Act : ', createActivityDto, req.user.customer);
    return this.activitiesService.createActivity(
      createActivityDto,
      req.user?.customer,
    );
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateActivityDto: any,
  ) {
    return this.activitiesService.updateActivity(id, updateActivityDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number,@Request() req) {
    return this.activitiesService.removeActivity(id,req.user?.customer);
  }
}
