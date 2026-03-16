import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateActivityZoneDto } from './dto/create-activity-zone.dto';
import { UpdateActivityZoneDto } from './dto/update-activity-zone.dto';
import { Customer } from '../customers/entities/customers.entity';
import { ActivityZone } from './entities/activity-zone.entity';
import {
  deleteFileIfExists,
  deleteMultipleFilesIfExist,
} from '../../../utils/common.helper';

@Injectable()
export class ActivityZonesService {
  constructor(
    @InjectRepository(ActivityZone)
    private readonly activityZoneRepository: Repository<ActivityZone>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(
    createData: CreateActivityZoneDto & {
      zone_thumbnail_image?: string;
      zone_image_gallery?: string[];
    },
    customer_id: number,
  ): Promise<ActivityZone> {
    // Validate customer existence
    const customer = await this.customerRepository.findOne({
      where: { id: customer_id },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customer_id} not found`);
    }

    try {
      // Create and save the Activity Zone
      const zone = this.activityZoneRepository.create({
        ...createData,
        customer: customer,
      });

      return await this.activityZoneRepository.save(zone);
    } catch (error) {
      console.error('Database Error:', error);
      throw new InternalServerErrorException(
        'Failed to save activity zone. Please check your input data.',
      );
    }
  }

  async findAll(customer_id: number) {
    try {
      // Find activity zones for the customer_id
      const activityZones = await this.activityZoneRepository.find({
        where: { customer: { id: customer_id } }, // Use the correct foreign key relation
      });

      return activityZones; // Return empty list if no records are found
    } catch {
      throw new InternalServerErrorException(
        'Failed to fetch Activity Zones from the database',
      );
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} activityZone`;
  }

  async update(
    id: number,
    updateActivityZoneDto: UpdateActivityZoneDto & {
      zone_thumbnail_image?: string;
      zone_image_gallery?: string[];
    },
  ) {
    try {
      console.log('Update Zone Svc :', updateActivityZoneDto);

      const activityZone = await this.activityZoneRepository.findOne({
        where: { id },
      });

      if (!activityZone) {
        throw new NotFoundException(`Activity zone with ID ${id} not found`);
      }

      // Handle thumbnail update
      if (updateActivityZoneDto.zone_thumbnail_image !== undefined) {
        await deleteFileIfExists(activityZone.zone_thumbnail_image);
        activityZone.zone_thumbnail_image =
          updateActivityZoneDto.zone_thumbnail_image;
      }

      // Handle gallery update
      if (updateActivityZoneDto.zone_image_gallery !== undefined) {
        await deleteMultipleFilesIfExist(activityZone.zone_image_gallery);
        activityZone.zone_image_gallery =
          updateActivityZoneDto.zone_image_gallery;
      }

      // Update other fields
      Object.assign(activityZone, updateActivityZoneDto);

      // Save and return updated entity
      return await this.activityZoneRepository.save(activityZone);
    } catch (error) {
      console.error('Error updating activity zone:', error);
      throw new InternalServerErrorException('Failed to update activity zone');
    }
  }

  async remove(id: number) {
    try {
      const activityZone = await this.activityZoneRepository.findOne({
        where: { id },
      });

      if (!activityZone) {
        throw new NotFoundException(`Activity zone with ID ${id} not found`);
      }

      if (activityZone.zone_thumbnail_image !== undefined) {
        await deleteFileIfExists(activityZone.zone_thumbnail_image);
      }

      // Handle gallery update
      if (activityZone.zone_image_gallery !== undefined) {
        await deleteMultipleFilesIfExist(activityZone.zone_image_gallery);
      }

      // Delete the entity
      await this.activityZoneRepository.delete(id);

      return {
        message: `Activity zone with ID ${id} and associated files deleted successfully`,
      };
    } catch (error) {
      console.error('Error deleting activity zone:', error);
      throw new InternalServerErrorException('Failed to delete activity zone');
    }
  }
}
