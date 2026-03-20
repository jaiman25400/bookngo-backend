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
import { CreateActivityZoneDto } from './dto/create-activity-zone.dto';
import { UploadsService } from '../../storage/uploads.service';
import { multerMemoryOptions } from '../../../utils/multer-memory';

const ZONE_UPLOAD_FOLDER = 'CMS/zones';

@Controller('activity-zones')
export class ActivityZonesController {
  constructor(
    private readonly activityZonesService: ActivityZonesService,
    private readonly uploads: UploadsService,
  ) {}

  @Post('add')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'zone_thumbnail_image', maxCount: 1 },
        { name: 'zone_image_gallery', maxCount: 5 },
      ],
      multerMemoryOptions,
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

      const thumb = uploadedFiles?.zone_thumbnail_image?.[0];
      const gallery = uploadedFiles?.zone_image_gallery;
      if (thumb) {
        filePaths.zone_thumbnail_image = await this.uploads.persistMulterFile(
          thumb,
          ZONE_UPLOAD_FOLDER,
        );
      }
      if (gallery?.length) {
        filePaths.zone_image_gallery = await this.uploads.persistMulterFiles(
          gallery,
          ZONE_UPLOAD_FOLDER,
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
      multerMemoryOptions,
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

    const thumb = uploadedFiles?.zone_thumbnail_image?.[0];
    const gallery = uploadedFiles?.zone_image_gallery;
    if (thumb) {
      filePaths.zone_thumbnail_image = await this.uploads.persistMulterFile(
        thumb,
        ZONE_UPLOAD_FOLDER,
      );
    }
    if (gallery?.length) {
      filePaths.zone_image_gallery = await this.uploads.persistMulterFiles(
        gallery,
        ZONE_UPLOAD_FOLDER,
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
