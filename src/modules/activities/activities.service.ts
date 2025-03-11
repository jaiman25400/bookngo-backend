// src/activities/activities.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { ActivityHoliday } from './entities/activity-holiday.entity';
import { ActivitySchedule } from './entities/activity-schedule.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { Customer } from '../customers/customers.entity';
import { ActivityZone } from '../activity-zones/entities/activity-zone.entity';
import { In, DataSource } from 'typeorm';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(ActivitySchedule)
    private readonly activityScheduleRepository: Repository<ActivitySchedule>,
    @InjectRepository(ActivityHoliday)
    private readonly activityHolidayRepository: Repository<ActivityHoliday>,
    @InjectRepository(ActivityZone)
    private readonly activityZoneRepository: Repository<ActivityZone>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly dataSource: DataSource,
  ) {}

  // Get activities for a specific customer
  async getActivitiesForCustomer(customerId: number): Promise<Activity[]> {
    try {
      const activities = await this.activityRepository.find({
        where: { customer: { id: customerId } }, // Filter by customer ID
        relations: ['zones', 'schedules', 'holidays'],
      });
      return activities;
    } catch (error) {
      console.error('Error fetching activities for customer:', error);
      throw new Error('Failed to fetch activities');
    }
  }

  // Create Activity
  async createActivity(
    createActivityDto: CreateActivityDto,
    customer_id: number,
  ): Promise<Activity> {
    const { zone_id = [], ...activityData } = createActivityDto;

    // Verify customer exists
    const customer = await this.customerRepository.findOne({
      where: { id: customer_id },
    });
    if (!customer) {
      throw new NotFoundException(`Customer ${customer_id} not found`);
    }

    // Verify zones exist
    const zones = await this.activityZoneRepository.findBy({
      id: In(zone_id),
    });
    if (zone_id.length > 0 && zones.length !== zone_id.length) {
      const missing = zone_id.filter((id) => !zones.some((z) => z.id === id));
      throw new NotFoundException(`Invalid zone IDs: ${missing.join(', ')}`);
    }
    const newActivity = this.activityRepository.create({
      ...activityData,
      customer,
      zones,
    });

    console.log('Final Activity :', newActivity);
    // 5. Save everything in one transaction
    return this.activityRepository.save(newActivity);
  }

  //Update Activity
  async updateActivity(id: number, updateActivityDTO: any): Promise<any> {
    const activity = await this.activityRepository.findOne({
      where: { id },
      relations: ['zones', 'schedules', 'holidays'],
    });

    if (!activity) throw new NotFoundException('Activity not found');

    // Update scalar fields
    if (updateActivityDTO.activity_name !== undefined)
      activity.activity_name = updateActivityDTO.activity_name;
    if (updateActivityDTO.base_price !== undefined)
      activity.base_price = updateActivityDTO.base_price;
    if (updateActivityDTO.duration_hours !== undefined)
      activity.duration_hours = updateActivityDTO.duration_hours;
    if (updateActivityDTO.start_date !== undefined)
      activity.start_date = updateActivityDTO.start_date;
    if (updateActivityDTO.end_date !== undefined)
      activity.end_date = updateActivityDTO.end_date;
    if (updateActivityDTO.is_active !== undefined)
      activity.is_active = updateActivityDTO.is_active;

    // Update Zones
    if (updateActivityDTO.zone_ids !== undefined) {
      const zones = await this.activityZoneRepository.findBy({
        id: In(updateActivityDTO.zone_ids),
      });
      activity.zones = zones;
    }

    // Handle Schedules (Update existing, add new, remove old)
    if (updateActivityDTO.schedules !== undefined) {
      const updatedSchedules = updateActivityDTO.schedules.map((dto) => {
        // Check if schedule exists and update, else create a new one
        let schedule = activity.schedules.find((sch) => sch.day === dto.day);
        if (!schedule) {
          schedule = new ActivitySchedule();
        }

        schedule.day = dto.day;
        schedule.start_time = dto.start_time || null;
        schedule.end_time = dto.end_time || null;
        schedule.is_24hours = dto.is_24hours;
        schedule.is_holiday = dto.is_holiday;

        return schedule;
      });

      // Update the schedules with the modified or newly created ones
      activity.schedules = updatedSchedules;
    }

    // Handle Holidays (Update existing, add new, remove old)
    if (updateActivityDTO.holidays !== undefined) {
      // Step 1: Map the new holiday data and update or create new holiday records
      const updatedHolidays = updateActivityDTO.holidays.map((dto) => {
        let holiday = activity.holidays.find((hol) => hol.date === dto.date);
        if (!holiday) {
          holiday = new ActivityHoliday(); // Create new holiday if not found
        }
        holiday.date = dto.date;

        // Do not set the activity reference here to avoid circular reference issues
        // holiday.activity = activity; // <-- Remove this line

        return holiday;
      });

      // Step 2: Identify and delete the holidays that were removed
      const removedHolidays = activity.holidays.filter(
        (hol) =>
          !updateActivityDTO.holidays.some((dto) => dto.date === hol.date),
      );

      // Step 3: Delete the removed holidays from the database
      for (const removedHoliday of removedHolidays) {
        await this.activityHolidayRepository.remove(removedHoliday);
      }

      // Step 4: Save or update the holidays (exclude circular references)
      await this.activityHolidayRepository.save(updatedHolidays);

      // Step 5: Update the holidays array with the new and updated holidays
      activity.holidays = updatedHolidays;
    }

    return this.activityRepository.save(activity);
  }

  // activities.service.ts
  async removeActivity(id: number, customerId: number): Promise<any> {
    try {
      console.log('Del service : ', id, customerId);
      // Find the activity and ensure it belongs to the correct customer
      const activity = await this.activityRepository.findOne({
        where: { id },
        relations: ['customer'],
      });

      if (!activity) {
        throw new NotFoundException(`Activity with ID ${id} not found.`);
      }

      if (activity.customer.id !== customerId) {
        throw new ForbiddenException(
          `You do not have permission to delete this activity.`,
        );
      }

      // Delete the activity (with cascading deletes for related tables)
      await this.activityRepository.delete(id);

      return {
        message: `Activity with ID ${id} has been deleted successfully.`,
      };
    } catch (error) {
      console.error(`Error deleting activity:`, error);

      // Handle unexpected errors
      throw new InternalServerErrorException(
        `An error occurred while deleting the activity.`,
      );
    }
  }
}
