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
} from '@nestjs/common';
import { ActivityZonesService } from './activity-zones.service';
import { CreateActivityZoneDto } from './dto/create-activity-zone.dto';
import { UpdateActivityZoneDto } from './dto/update-activity-zone.dto';

@Controller('activity-zones')
export class ActivityZonesController {
  constructor(
    private readonly activityZonesService: ActivityZonesService,
  ) {}

  @Post('add')
  async create(
    @Body() createActivityZoneDto: CreateActivityZoneDto,
    @Request() req,
  ) {
    try {
      const customer_id = req.user?.customer; // Get the customer_id from the user data

      if (!req.user?.customer) {
        throw new BadRequestException('Customer ID is missing for the user');
      }

      // Pass the customer_id along with the rest of the activity zone data
      return await this.activityZonesService.create({
        ...createActivityZoneDto,
        customer_id,
      });
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
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateActivityZoneDto: UpdateActivityZoneDto,
  ) {
    if (Object.keys(updateActivityZoneDto).length === 0) {
      throw new BadRequestException('Empty payload');
    }

    return this.activityZonesService.update(id, updateActivityZoneDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.activityZonesService.remove(id);
  }
  
}
