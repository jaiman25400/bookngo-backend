// src/activities/activities.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { Customer } from '../customers/customers.entity';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,

    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  // Get activities for a specific customer
  async getActivitiesForCustomer(customerId: number): Promise<Activity[]> {
    try {
      const activities = await this.activityRepository.find({
        where: { customer: { id: customerId } }, // Filter by customer ID
      });
      return activities;
    } catch (error) {
      console.error('Error fetching activities for customer:', error);
      throw new Error('Failed to fetch activities');
    }
  }

  async createActivity(
    createActivityDto: CreateActivityDto,
  ): Promise<Activity> {
    console.log('CREATE ATV HIT ', createActivityDto);
    const { customer_id, ...activityData } = createActivityDto;

    // ✅ Step 1: Verify that the customer exists
    const customer = await this.customerRepository.findOne({
      where: { id: customer_id },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customer_id} not found`);
    }

    // ✅ Step 2: Create a new activity and associate it with the customer
    const newActivity = this.activityRepository.create({
      customer,
      ...activityData, // Includes the other activity data
    });

    // ✅ Step 3: Save to database and return response
    return await this.activityRepository.save(newActivity);
  }
}
