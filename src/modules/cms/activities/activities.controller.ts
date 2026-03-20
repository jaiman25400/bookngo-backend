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
import { UploadsService } from '../../storage/uploads.service';
import { multerMemoryOptions } from '../../../utils/multer-memory';

const ACTIVITY_UPLOAD_FOLDER = 'CMS/activity';

@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly uploads: UploadsService,
  ) {}

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
      multerMemoryOptions,
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

    const thumb = uploadedFiles.activity_thumbnail_image?.[0];
    const gallery = uploadedFiles.activity_image_gallery;
    const filePaths = {
      activity_thumbnail_image: thumb
        ? await this.uploads.persistMulterFile(thumb, ACTIVITY_UPLOAD_FOLDER)
        : undefined,
      activity_image_gallery: gallery?.length
        ? await this.uploads.persistMulterFiles(gallery, ACTIVITY_UPLOAD_FOLDER)
        : undefined,
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
      multerMemoryOptions,
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

      const thumb = uploadedFiles?.activity_thumbnail_image?.[0];
      const gallery = uploadedFiles?.activity_image_gallery;
      if (thumb) {
        filePaths.activity_thumbnail_image =
          await this.uploads.persistMulterFile(thumb, ACTIVITY_UPLOAD_FOLDER);
      }
      if (gallery?.length) {
        filePaths.activity_image_gallery =
          await this.uploads.persistMulterFiles(gallery, ACTIVITY_UPLOAD_FOLDER);
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
