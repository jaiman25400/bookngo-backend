import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  BadRequestException,
  InternalServerErrorException,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ActivityZonesService } from './activity-zones.service';
import { UpdateActivityZoneDto } from './dto/update-activity-zone.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { CreateActivityZoneDto } from './dto/create-activity-zone.dto';

@Controller('activity-zones')
export class ActivityZonesController {
  constructor(private readonly activityZonesService: ActivityZonesService) {}

  @Post('add')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'zone_thumbnail_image', maxCount: 1 },
        { name: 'zone_image_gallery', maxCount: 5 },
      ],
      {
        storage: diskStorage({
          destination: join(process.cwd(), 'uploads', 'CMS', 'zones'),
          filename: (req, file, cb) => {
            const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
            cb(null, uniqueName);
          },
        }),
      },
    ),
  )
  async create(
    @Body() createActivityZoneDto: CreateActivityZoneDto,
    @Request() req,
    @UploadedFiles()
    uploadedFiles: {
      zone_thumbnail_image?: Express.Multer.File[];
      zone_image_gallery?: Express.Multer.File[];
    },
  ) {
    try {
      console.log('Files:', uploadedFiles);
      console.log('DTO:', createActivityZoneDto);

      const customer_id = req.user?.customer; // Get the customer_id from the user data

      if (!customer_id) {
        throw new BadRequestException('Customer ID is missing for the user');
      }

      const filePaths: {
        zone_thumbnail_image?: string;
        zone_image_gallery?: string[];
      } = {};

      // Handle thumbnail file
      if (uploadedFiles?.zone_thumbnail_image?.[0]) {
        filePaths.zone_thumbnail_image = `/uploads/CMS/zones/${uploadedFiles.zone_thumbnail_image[0].filename}`;
      }

      // Handle gallery files
      if (uploadedFiles?.zone_image_gallery?.length) {
        filePaths.zone_image_gallery = uploadedFiles.zone_image_gallery.map(
          (f) => `/uploads/CMS/zones/${f.filename}`,
        );
      }

      // Pass the customer_id along with the rest of the activity zone data
      return this.activityZonesService.create(
        { ...createActivityZoneDto, ...filePaths },
        customer_id,
      );
    } catch (error) {
      console.error('Error creating Activity Zone:', error);
      throw new InternalServerErrorException(
        'Failed to create Activity Zone. Please try again later.',
      );
    }
  }

  @Get()
  async findAll(@Request() req) {
    try {
      // Fetch all activity zones for the customer
      return await this.activityZonesService.findAll(req.user?.customer);
    } catch (error) {
      console.error('Error fetching Activity Zones:', error);
      throw new InternalServerErrorException(
        'Failed to fetch Activity Zones. Please try again later.',
      );
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activityZonesService.findOne(+id);
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'zone_thumbnail_image', maxCount: 1 },
        { name: 'zone_image_gallery', maxCount: 5 },
      ],
      {
        storage: diskStorage({
          destination: join(process.cwd(), 'uploads', 'CMS', 'zones'),
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
    @Body() updateActivityZoneDto: UpdateActivityZoneDto,
    @UploadedFiles()
    uploadedFiles: {
      zone_thumbnail_image?: Express.Multer.File[];
      zone_image_gallery?: Express.Multer.File[];
    },
  ) {
    const filePaths: {
      zone_thumbnail_image?: string;
      zone_image_gallery?: string[];
    } = {};

    // Handle thumbnail file
    if (uploadedFiles?.zone_thumbnail_image?.[0]) {
      filePaths.zone_thumbnail_image = `/uploads/CMS/zones/${uploadedFiles.zone_thumbnail_image[0].filename}`;
    }

    // Handle gallery files
    if (uploadedFiles?.zone_image_gallery?.length) {
      filePaths.zone_image_gallery = uploadedFiles.zone_image_gallery.map(
        (f) => `/uploads/CMS/zones/${f.filename}`,
      );
    }

    return this.activityZonesService.update(id, {
      ...updateActivityZoneDto,
      ...filePaths,
    });
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.activityZonesService.remove(id);
  }
}
