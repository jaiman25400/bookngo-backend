import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateActivityZoneDto } from './dto/create-activity-zone.dto';
import { UpdateActivityZoneDto } from './dto/update-activity-zone.dto';
import { Customer } from '../customers/customers.entity';
import { ActivityZone } from './entities/activity-zone.entity';

@Injectable()
export class ActivityZonesService {
  constructor(
    @InjectRepository(ActivityZone)
    private readonly activityZoneRepository: Repository<ActivityZone>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(
    createActivityZoneDto: CreateActivityZoneDto & { customer_id: number },
  ): Promise<ActivityZone> {
    const { customer_id, ...zoneData } = createActivityZoneDto;

    // Validate customer existence
    const customer = await this.customerRepository.findOne({
      where: { id: customer_id },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customer_id} not found`);
    }

    try {
      // Create and save the Activity Zone
      const activityZone = this.activityZoneRepository.create({
        ...zoneData,
        customer,
      });
      return await this.activityZoneRepository.save(activityZone);
    } catch (error) {
      throw new InternalServerErrorException(
        'Error occurred while saving Activity Zone',
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
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch Activity Zones from the database',
      );
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} activityZone`;
  }

  async update(id: number, updateActivityZoneDto: UpdateActivityZoneDto) {
    try {
      console.log('Update Service:', updateActivityZoneDto);

      // Check if the activity zone exists
      const activityZone = await this.activityZoneRepository.findOne({
        where: { id },
      });

      if (!activityZone) {
        throw new NotFoundException(`Activity zone with ID ${id} not found`);
      }

      // Update the entity
      await this.activityZoneRepository.update(id, updateActivityZoneDto);

      // Return the updated entity
      return this.activityZoneRepository.findOne({ where: { id } });
    } catch (error) {
      console.error('Error updating activity zone:', error);
      throw new InternalServerErrorException('Failed to update activity zone');
    }
  }

  async remove(id: number) {
    try {
      // Check if the activity zone exists
      const activityZone = await this.activityZoneRepository.findOne({
        where: { id },
      });

      if (!activityZone) {
        throw new NotFoundException(`Activity zone with ID ${id} not found`);
      }

      // Delete the entity
      await this.activityZoneRepository.delete(id);

      return { message: `Activity zone with ID ${id} deleted successfully` };
    } catch (error) {
      console.error('Error deleting activity zone:', error);
      throw new InternalServerErrorException('Failed to delete activity zone');
    }
  }
}
