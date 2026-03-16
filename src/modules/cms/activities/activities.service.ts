// src/activities/activities.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { ActivityHoliday } from './entities/activity-holiday.entity';
import { ActivitySchedule } from './entities/activity-schedule.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { Customer } from '../customers/entities/customers.entity';
import { ActivityZone } from '../activity-zones/entities/activity-zone.entity';
import { In, DataSource } from 'typeorm';
import { ActivityType, BookingType } from './enums/activity-type.enum';
import {
  handleFileUpdates,
  updateHolidays,
  updateScalarFields,
  updateSchedules,
  updateZones,
} from './utils/activities.helper';
import {
  deleteFileIfExists,
  deleteMultipleFilesIfExist,
} from '../../../utils/common.helper';

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
    createData: CreateActivityDto & {
      activity_thumbnail_image?: string | undefined;
      activity_image_gallery?: string[] | undefined;
    },
    customer_id: number,
  ): Promise<Activity> {
    // Validate dates
    if (new Date(createData.start_date) >= new Date(createData.end_date)) {
      throw new BadRequestException('Start date must be before end date');
    }

    const customer = await this.customerRepository.findOne({
      where: { id: customer_id },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customer_id} not found`);
    }

    try {
      // Validate zone_ids
      let zones: ActivityZone[] = [];
      if (createData?.zone_id) {
        try {
          const zoneIds = createData.zone_id;
          if (!Array.isArray(zoneIds)) {
            throw new BadRequestException('zone_id must be a JSON array');
          }

          zones = await this.activityZoneRepository.findBy({
            id: In(zoneIds),
          });

          if (zones.length !== zoneIds.length) {
            const missing = zoneIds.filter(
              (id) => !zones.some((z) => z.id === id),
            );
            throw new NotFoundException(
              `Invalid zone IDs: ${missing.join(', ')}`,
            );
          }
        } catch (e) {
          if (e instanceof SyntaxError) {
            throw new BadRequestException('Invalid zone_id JSON format');
          }
          throw e;
        }
      }

      // schedules
      let schedules: ActivitySchedule[] = [];
      if (createData?.schedules) {
        try {
          const scheduleData = createData.schedules;
          if (!Array.isArray(scheduleData)) {
            throw new BadRequestException('schedules must be a JSON array');
          }
          schedules = scheduleData.map((s) => {
            const schedule = new ActivitySchedule();
            Object.assign(schedule, s);
            return schedule;
          });
        } catch (e) {
          if (e instanceof SyntaxError) {
            throw new BadRequestException('Invalid schedules JSON format');
          }
          throw e;
        }
      }

      // holidays
      let holidays: ActivityHoliday[] = [];
      if (createData?.holidays) {
        try {
          const holidayData = createData.holidays;
          if (!Array.isArray(holidayData)) {
            throw new BadRequestException('holidays must be a JSON array');
          }
          holidays = holidayData.map((h) => {
            const holiday = new ActivityHoliday();
            holiday.date = new Date(h.date);
            return holiday;
          });
        } catch (e) {
          if (e instanceof SyntaxError) {
            throw new BadRequestException('Invalid holidays JSON format');
          }
          throw e;
        }
      }

      //  Convert booking_type from string to enum.
      // If the provided booking_type is valid, use it; otherwise, default to ANYTIME.
      let bookingType: BookingType = BookingType.ANYTIME;
      if (createData.booking_type) {
        // Check if the provided value is one of the enum values
        if (
          Object.values(BookingType).includes(
            createData.booking_type as BookingType,
          )
        ) {
          bookingType = createData.booking_type as BookingType;
        } else {
          throw new BadRequestException(
            `Invalid booking_type: ${createData.booking_type}`,
          );
        }
      }

      // Validate activity_type
      let activityType: ActivityType = ActivityType.SKIING; // Default value
      if (createData.activity_type) {
        if (Object.values(ActivityType).includes(createData.activity_type)) {
          activityType = createData.activity_type;
        } else {
          throw new BadRequestException(
            `Invalid activity_type: ${createData.activity_type}. Valid types: ${Object.values(ActivityType).join(', ')}`,
          );
        }
      }

      // Construct the activity data explicitly.
      const activityData = {
        customer,
        zones,
        schedules,
        holidays,
        activity_name: createData.activity_name,
        activity_description: createData.activity_description,
        base_price: createData.base_price,
        duration_hours: createData.duration_hours,
        start_date: createData.start_date,
        end_date: createData.end_date,
        age_group: createData.age_group,
        activity_tagline: createData.activity_tagline,
        slot_interval_minutes: createData.slot_interval_minutes,
        max_per_slot: createData.max_per_slot,
        activity_thumbnail_image: createData.activity_thumbnail_image,
        activity_image_gallery: createData.activity_image_gallery,
        is_active: createData.is_active,
        safety_instructions: createData.safety_instructions,
        requires_waiver: createData.requires_waiver,
        booking_type: bookingType,
        activity_type: activityType,
        redirect_to_external_website: createData.redirect_to_external_website ?? false,
        external_booking_url: createData.external_booking_url ?? null,
      };

      // Create and save the new activity entity
      const newActivity = this.activityRepository.create(activityData);
      return await this.activityRepository.save(newActivity);
    } catch (error) {
      console.error('Error creating activity:', error);

      // Handle known error types
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Handle database errors
      if (error instanceof QueryFailedError) {
        throw new InternalServerErrorException('Database operation failed');
      }

      // Fallback for unexpected errors
      throw new InternalServerErrorException('Failed to create activity');
    }
  }

  //Update Activity
  async updateActivity(
    id: number,
    updateActivityDTO: any & {
      activity_thumbnail_image?: string;
      activity_image_gallery?: string[];
    },
  ): Promise<any> {
    try {
      const activity = await this.activityRepository.findOne({
        where: { id },
        relations: ['zones', 'schedules', 'holidays'],
      });

      if (!activity) throw new NotFoundException('Activity not found');

      // Handle file updates first
      await handleFileUpdates(activity, updateActivityDTO);

      // // Update scalar fields using DTO
      await updateScalarFields(activity, updateActivityDTO);

      // // Update relationships
      await updateZones(
        activity,
        updateActivityDTO.zone_id,
        this.activityZoneRepository,
      );
      await updateSchedules(
        activity,
        updateActivityDTO.schedules,
        this.activityScheduleRepository,
      );
      await updateHolidays(
        activity,
        updateActivityDTO,
        this.activityHolidayRepository,
      );

      // Save the updated activity
      const updatedActivity = await this.activityRepository.save(activity);
      return updatedActivity;
    } catch (error) {
      console.error('Error updating activity data:', error);
      throw new InternalServerErrorException('Failed to update activity data');
    }
  }

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

      if (activity.activity_thumbnail_image != undefined) {
        await deleteFileIfExists(activity.activity_thumbnail_image);
      }

      if (activity.activity_image_gallery != undefined) {
        await deleteMultipleFilesIfExist(activity.activity_image_gallery);
      }

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
