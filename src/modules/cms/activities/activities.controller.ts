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
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { Activity } from './entities/activity.entity';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';

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
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'activity_thumbnail_image', maxCount: 1 },
        { name: 'activity_image_gallery', maxCount: 5 },
      ],
      {
        storage: diskStorage({
          destination: join(process.cwd(), 'uploads', 'CMS', 'activity'),
          filename: (req, file, cb) => {
            const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
            cb(null, uniqueName);
          },
        }),
      },
    ),
  )
  async createActivity(
    @Body() createActivityDto: CreateActivityDto,
    @Request() req,
    @UploadedFiles()
    uploadedFiles: {
      activity_thumbnail_image?: Express.Multer.File[];
      activity_image_gallery?: Express.Multer.File[];
    },
  ): Promise<Activity> {
    const customer_id = req.user?.customer; // Get the customer_id from the user data

    if (!customer_id) {
      throw new BadRequestException('Customer ID is missing for the user');
    }

    // Handle file paths
    const filePaths = {
      activity_thumbnail_image: uploadedFiles.activity_thumbnail_image?.[0]
        ? `/uploads/CMS/activity/${uploadedFiles.activity_thumbnail_image[0].filename}`
        : undefined,
      activity_image_gallery:
        uploadedFiles.activity_image_gallery?.map(
          (f) => `/uploads/CMS/activity/${f.filename}`,
        ) ?? undefined, // Return null if the left side is undefined/null
    };

    return this.activitiesService.createActivity(
      { ...createActivityDto, ...filePaths },
      customer_id,
    );
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'activity_thumbnail_image', maxCount: 1 },
        { name: 'activity_image_gallery', maxCount: 5 },
      ],
      {
        storage: diskStorage({
          destination: join(process.cwd(), 'uploads', 'CMS', 'activity'),
          filename: (req, file, cb) => {
            const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
            cb(null, uniqueName);
          },
        }),
      },
    ),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() updateActivityDto: UpdateActivityDto,
    @UploadedFiles()
    uploadedFiles: {
      activity_thumbnail_image?: Express.Multer.File[];
      activity_image_gallery?: Express.Multer.File[];
    },
  ) {
    try {
      console.log(updateActivityDto);
      const customer_id = req.user?.customer; // Get the customer_id from the user data

      if (!customer_id) {
        throw new BadRequestException('Customer ID is missing for the user');
      }

      const filePaths: {
        activity_thumbnail_image?: string;
        activity_image_gallery?: string[];
      } = {};

      // Handle thumbnail file
      if (uploadedFiles?.activity_thumbnail_image?.[0]) {
        filePaths.activity_thumbnail_image = `/uploads/CMS/activity/${uploadedFiles.activity_thumbnail_image[0].filename}`;
      }

      // Handle gallery files
      if (uploadedFiles?.activity_image_gallery?.length) {
        filePaths.activity_image_gallery =
          uploadedFiles.activity_image_gallery.map(
            (f) => `/uploads/CMS/activity/${f.filename}`,
          );
      }

      return this.activitiesService.updateActivity(id, {
        ...updateActivityDto,
        ...filePaths,
      });
    } catch (error) {
      console.error('Error creating Activity Zone:', error);
      throw new InternalServerErrorException(
        'Failed to create Activity Zone. Please try again later.',
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.activitiesService.removeActivity(id, req.user?.customer);
  }
}
