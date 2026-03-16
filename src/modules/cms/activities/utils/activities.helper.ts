import {
  deleteFileIfExists,
  deleteMultipleFilesIfExist,
} from '../../../../utils/common.helper';
import { UpdateActivityDto } from '../dto/update-activity.dto';
import { Activity } from '../entities/activity.entity';
import { ActivityZone } from '../../activity-zones/entities/activity-zone.entity';
import { In, Repository } from 'typeorm';
import { ActivitySchedule } from '../entities/activity-schedule.entity';
import { ActivityHoliday } from '../entities/activity-holiday.entity';

/**
 * Handles file updates (thumbnail & gallery) for an activity.
 */
export async function handleFileUpdates(activity: Activity, dto: any) {
  // Handle thumbnail update
  if (dto.activity_thumbnail_image !== undefined) {
    await deleteFileIfExists(activity.activity_thumbnail_image);
    activity.activity_thumbnail_image = dto.activity_thumbnail_image;
  }

  // Handle gallery update
  if (dto.activity_image_gallery !== undefined) {
    await deleteMultipleFilesIfExist(activity.activity_image_gallery);
    activity.activity_image_gallery = dto.activity_image_gallery;
  }
}

/**
 * Updates scalar fields of the activity entity.
 */
export async function updateScalarFields(
  activity: Activity,
  dto: UpdateActivityDto,
) {
  const scalarFields = [
    'activity_name',
    'base_price',
    'duration_hours',
    'start_date',
    'end_date',
    'is_active',
    'booking_type',
    'activity_tagline',
    'slot_interval_minutes',
    'max_per_slot',
    'activity_description',
    'safety_instructions',
    'requires_waiver',
    'provides_rentals',
    'age_group',
    'activity_type',
    'activity_image_gallery',
    'activity_thumbnail_image',
    'redirect_to_external_website',
    'external_booking_url',
  ];

  scalarFields.forEach((field) => {
    if (dto[field] !== undefined) {
      activity[field] = dto[field];
    }
  });
}

/**
 * Updates activity zones relationship
 */
export async function updateZones(
  activity: Activity,
  dto: number[],
  zoneRepository: Repository<ActivityZone>,
): Promise<void> {
  if (!dto) return;

  // Handle both string and array inputs
  const zoneIds = Array.isArray(dto) ? dto : [dto];

  const zones = await zoneRepository.findBy({
    id: In(zoneIds),
  });

  activity.zones = zones;
}

/**
 * Updates activity schedules with proper transaction handling
 */
export async function updateSchedules(
  activity: Activity,
  dto: any,
  scheduleRepository: Repository<ActivitySchedule>,
): Promise<void> {
  if (!dto) return;
  // Map DTO to schedule entities
  const updatedSchedules = dto.map((scheduleDto: any) => {
    const schedule =
      activity.schedules.find((s) => s.day === scheduleDto.day) ||
      new ActivitySchedule();

    // Set properties EXCEPT activity
    Object.assign(schedule, {
      day: scheduleDto.day,
      start_time: scheduleDto.start_time || null,
      end_time: scheduleDto.end_time || null,
      duration: scheduleDto.duration || null,
      price: scheduleDto.price || null,
      is_24hours: scheduleDto.is_24hours ?? false,
      is_holiday: scheduleDto.is_holiday ?? false,
      // Remove the direct activity assignment
    });

    // Set activity ID instead of the whole object
    schedule.activity = { id: activity.id } as Activity;

    return schedule;
  });

  const savedSchedules = await scheduleRepository.save(updatedSchedules);

  activity.schedules = savedSchedules;
}

export async function updateHolidays(
  activity: Activity,
  updateActivityDTO: any,
  activityHolidayRepository: Repository<ActivityHoliday>,
) {
  if (updateActivityDTO.holidays === undefined) return;

  // Step 1: Map the new holiday data
  const updatedHolidays = updateActivityDTO.holidays.map((dto) => {
    let holiday = activity.holidays.find((hol) => hol.date === dto.date);
    if (!holiday) {
      holiday = new ActivityHoliday();
    }
    holiday.date = dto.date;

    // Do not set activity reference here to avoid circular references
    return holiday;
  });

  // Step 2: Find removed holidays
  const removedHolidays = activity.holidays.filter(
    (hol) => !updateActivityDTO.holidays.some((dto) => dto.date === hol.date),
  );

  // Step 3: Delete removed holidays
  for (const removedHoliday of removedHolidays) {
    await activityHolidayRepository.remove(removedHoliday);
  }

  // Step 4: Save new/updated holidays
  await activityHolidayRepository.save(updatedHolidays);

  // Step 5: Update holidays in the activity
  activity.holidays = updatedHolidays;
}
