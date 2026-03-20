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
import { UploadsService } from '../../storage/uploads.service';

@Injectable()
export class ActivityZonesService {
  constructor(
    @InjectRepository(ActivityZone)
    private readonly activityZoneRepository: Repository<ActivityZone>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly uploads: UploadsService,
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

      const saved = await this.activityZoneRepository.save(zone);
      return {
        ...saved,
        zone_thumbnail_image:
          (await this.uploads.resolveDisplayUrl(saved.zone_thumbnail_image)) ??
          '',
        zone_image_gallery: (
          await this.uploads.resolveDisplayUrlList(saved.zone_image_gallery)
        ).filter((u): u is string => u != null),
      };
    } catch (error) {
      console.error('Database Error:', error);
      throw new InternalServerErrorException(
        'Failed to save activity zone. Please check your input data.',
      );
    }
  }

  async findAll(customer_id: number) {
    try {
      const activityZones = await this.activityZoneRepository.find({
        where: { customer: { id: customer_id } },
      });

      return Promise.all(
        activityZones.map(async (z) => ({
          ...z,
          zone_thumbnail_image:
            (await this.uploads.resolveDisplayUrl(z.zone_thumbnail_image)) ?? '',
          zone_image_gallery: (
            await this.uploads.resolveDisplayUrlList(z.zone_image_gallery)
          ).filter((u): u is string => u != null),
        })),
      );
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
        await this.uploads.deleteStored(activityZone.zone_thumbnail_image);
        activityZone.zone_thumbnail_image =
          updateActivityZoneDto.zone_thumbnail_image;
      }

      // Handle gallery update
      if (updateActivityZoneDto.zone_image_gallery !== undefined) {
        await this.uploads.deleteManyStored(activityZone.zone_image_gallery);
        activityZone.zone_image_gallery =
          updateActivityZoneDto.zone_image_gallery;
      }

      // Update other fields
      Object.assign(activityZone, updateActivityZoneDto);

      const saved = await this.activityZoneRepository.save(activityZone);
      return {
        ...saved,
        zone_thumbnail_image: await this.uploads.resolveDisplayUrl(
          saved.zone_thumbnail_image,
        ),
        zone_image_gallery: await this.uploads.resolveDisplayUrlList(
          saved.zone_image_gallery,
        ),
      };
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
        await this.uploads.deleteStored(activityZone.zone_thumbnail_image);
      }

      if (activityZone.zone_image_gallery !== undefined) {
        await this.uploads.deleteManyStored(activityZone.zone_image_gallery);
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
