import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Customer } from '../../cms/customers/entities/customers.entity';
import { CustomerDetail } from '../../cms/customers/entities/customers-detail.entity';
import { CustomerUser } from '../../cms/customer-users/customers-users.entity';
import { ActivityZone } from '../../cms/activity-zones/entities/activity-zone.entity';
import { ZoneStatus } from '../../cms/activity-zones/entities/activity-zone.entity';
import { Activity } from '../../cms/activities/entities/activity.entity';
import { ActivitySchedule } from '../../cms/activities/entities/activity-schedule.entity';
import { ActivityHoliday } from '../../cms/activities/entities/activity-holiday.entity';
import { Inventory } from '../../cms/inventory/entities/inventory.entity';
import { InventorySize } from '../../cms/inventory/entities/inventory-size.entity';
import {
  ActivityType,
  BookingType,
} from '../../cms/activities/enums/activity-type.enum';
import { OnboardIceSkatingClientDto } from './dto/onboard-ice-skating-client.dto';

const ADMIN_PASSWORD = 'BookNGO@123';
const START_DATE = new Date('2026-02-01');
const END_DATE = new Date('2027-02-01');

/** Build URL-safe slug from organization name */
function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/** Email from name: slug without hyphens + @gmail.com */
function emailFromName(name: string): string {
  const slug = slugFromName(name);
  const local = slug.replace(/-/g, '') || 'client';
  return `${local}@gmail.com`;
}

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(CustomerDetail)
    private readonly customerDetailRepo: Repository<CustomerDetail>,
    @InjectRepository(CustomerUser)
    private readonly customerUserRepo: Repository<CustomerUser>,
    @InjectRepository(ActivityZone)
    private readonly zoneRepo: Repository<ActivityZone>,
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(ActivitySchedule)
    private readonly scheduleRepo: Repository<ActivitySchedule>,
    @InjectRepository(ActivityHoliday)
    private readonly holidayRepo: Repository<ActivityHoliday>,
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(InventorySize)
    private readonly inventorySizeRepo: Repository<InventorySize>,
    private readonly dataSource: DataSource,
  ) {}

  async onboardIceSkatingClient(
    dto: OnboardIceSkatingClientDto,
  ): Promise<{
    customer_id: number;
    admin_user_id: number;
    zone_id: number;
    activity_id: number;
    message: string;
  }> {
    const name = dto.name.trim();
    const city = dto.city.trim();
    const slug = slugFromName(name);
    const email = emailFromName(name);

    if (!name || !city) {
      throw new BadRequestException('name and city are required');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Customer
      const customer = queryRunner.manager.create(Customer, {
        customer_name: name,
        business_type: ['Winter'],
        is_active: true,
      });
      const savedCustomer = await queryRunner.manager.save(Customer, customer);

      // 2. Customer detail
      const detail = queryRunner.manager.create(CustomerDetail, {
        customer: savedCustomer as Customer,
        customer_display_name: name,
        customer_slug: slug,
        customer_city: city,
        customer_state: dto.state?.trim() || 'Ontario',
        customer_latitude: dto.latitude,
        customer_longitude: dto.longitude,
        customer_description: '',
        customer_address: '',
        customer_zip: undefined,
        home_tagLine: undefined,
        customer_display_email: email,
        home_image_url: undefined,
        home_image_gallery: undefined,
        about_us: undefined,
        features: undefined,
      } as Partial<CustomerDetail>);
      await queryRunner.manager.save(CustomerDetail, detail);

      // 3. Admin customer user
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      const adminUser = queryRunner.manager.create(CustomerUser, {
        customer: savedCustomer,
        email,
        name,
        password: hashedPassword,
        role: 'Admin',
        is_active: true,
        password_token: null,
      });
      const savedAdminUser = await queryRunner.manager.save(CustomerUser, adminUser);

      // 4. Zone
      const zone = queryRunner.manager.create(ActivityZone, {
        customer: savedCustomer as Customer,
        name: 'Ice Skating Rink',
        description: 'Main ice skating area',
        status: ZoneStatus.ACTIVE,
        age_group: undefined,
        zone_tagline: undefined,
        zone_thumbnail_image: undefined,
        zone_image_gallery: undefined,
        capacity: undefined,
        price: undefined,
      } as Partial<ActivityZone>);
      const savedZone = await queryRunner.manager.save(ActivityZone, zone);

      // 5. Schedules: Mon–Fri 9–21, Sat–Sun 9–23
      const weekdays = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
      ];
      const weekend = ['Saturday', 'Sunday'];
      const scheduleRows: Partial<ActivitySchedule>[] = [
        ...weekdays.map((day) => ({
          day,
          start_time: '09:00:00',
          end_time: '21:00:00',
          duration: undefined,
          price: undefined,
          is_24hours: false,
          is_holiday: false,
        })),
        ...weekend.map((day) => ({
          day,
          start_time: '09:00:00',
          end_time: '23:00:00',
          duration: undefined,
          price: undefined,
          is_24hours: false,
          is_holiday: false,
        })),
      ];

      // 6. Activity (saved first without schedules, then schedules linked)
      const activity = queryRunner.manager.create(Activity, {
        customer: savedCustomer as Customer,
        activity_name: 'Skating',
        activity_type: ActivityType.SKATING,
        activity_description: 'Public ice skating',
        base_price: 10,
        duration_hours: 3,
        start_date: START_DATE,
        end_date: END_DATE,
        slot_interval_minutes: 60,
        max_per_slot: 10,
        is_active: true,
        activity_tagline: undefined,
        activity_thumbnail_image: undefined,
        activity_image_gallery: undefined,
        safety_instructions: undefined,
        requires_waiver: false,
        provides_rentals: true,
        booking_type: BookingType.ANYTIME,
        redirect_to_external_website: false,
        external_booking_url: undefined,
        age_group: undefined,
        zones: [savedZone],
      } as Partial<Activity>);
      const savedActivity = await queryRunner.manager.save(Activity, activity);

      const schedules = scheduleRows.map((row) =>
        queryRunner.manager.create(ActivitySchedule, {
          ...row,
          activity: savedActivity,
        }),
      );
      await queryRunner.manager.save(ActivitySchedule, schedules);

      // 7. Rentals inventory: 20 total, Men 8 → 10, Women 8 → 10
      const inventory = queryRunner.manager.create(Inventory, {
        customer: savedCustomer as Customer,
        equipment_name: 'Skate Rentals',
        totalQuantity: 20,
        availableQuantity: 20,
        rental_price_per_hour: 15,
        description: undefined,
        thumbnailImageUrl: undefined,
      } as Partial<Inventory>);
      const savedInventory = await queryRunner.manager.save(
        Inventory,
        inventory,
      );

      const sizes: Partial<InventorySize>[] = [
        { size: 'Men 8', quantity: 10, description: undefined },
        { size: 'Women 8', quantity: 10, description: undefined },
      ];
      for (const s of sizes) {
        const sizeRow = queryRunner.manager.create(InventorySize, {
          ...s,
          inventory: savedInventory,
        });
        await queryRunner.manager.save(InventorySize, sizeRow);
      }

      await queryRunner.commitTransaction();

      return {
        customer_id: savedCustomer.id,
        admin_user_id: savedAdminUser.id,
        zone_id: savedZone.id,
        activity_id: savedActivity.id,
        message: `Ice skating client onboarded. Admin login: ${email} / ${ADMIN_PASSWORD}`,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (
        err instanceof BadRequestException ||
        err instanceof InternalServerErrorException
      ) {
        throw err;
      }
      throw new InternalServerErrorException(
        err?.message || 'Onboarding failed',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async onboardSkiingClient(
    dto: OnboardIceSkatingClientDto,
  ): Promise<{
    customer_id: number;
    admin_user_id: number;
    zone_id: number;
    activity_id: number;
    message: string;
  }> {
    const name = dto.name.trim();
    const city = dto.city.trim();
    const slug = slugFromName(name);
    const email = emailFromName(name);

    if (!name || !city) {
      throw new BadRequestException('name and city are required');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const customer = queryRunner.manager.create(Customer, {
        customer_name: name,
        business_type: ['Winter'],
        is_active: true,
      });
      const savedCustomer = await queryRunner.manager.save(Customer, customer);

      const detail = queryRunner.manager.create(CustomerDetail, {
        customer: savedCustomer as Customer,
        customer_display_name: name,
        customer_slug: slug,
        customer_city: city,
        customer_state: dto.state?.trim() || 'Ontario',
        customer_latitude: dto.latitude,
        customer_longitude: dto.longitude,
        customer_description: '',
        customer_address: '',
        customer_zip: undefined,
        home_tagLine: undefined,
        customer_display_email: email,
        home_image_url: undefined,
        home_image_gallery: undefined,
        about_us: undefined,
        features: undefined,
      } as Partial<CustomerDetail>);
      await queryRunner.manager.save(CustomerDetail, detail);

      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      const adminUser = queryRunner.manager.create(CustomerUser, {
        customer: savedCustomer,
        email,
        name,
        password: hashedPassword,
        role: 'Admin',
        is_active: true,
        password_token: null,
      });
      const savedAdminUser = await queryRunner.manager.save(CustomerUser, adminUser);

      const zone = queryRunner.manager.create(ActivityZone, {
        customer: savedCustomer as Customer,
        name: 'Skiing Slope',
        description: 'Main skiing slope area',
        status: ZoneStatus.ACTIVE,
        age_group: undefined,
        zone_tagline: undefined,
        zone_thumbnail_image: undefined,
        zone_image_gallery: undefined,
        capacity: undefined,
        price: undefined,
      } as Partial<ActivityZone>);
      const savedZone = await queryRunner.manager.save(ActivityZone, zone);

      const weekdays = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
      ];
      const weekend = ['Saturday', 'Sunday'];
      const scheduleRows: Partial<ActivitySchedule>[] = [
        ...weekdays.map((day) => ({
          day,
          start_time: '09:00:00',
          end_time: '21:00:00',
          duration: undefined,
          price: undefined,
          is_24hours: false,
          is_holiday: false,
        })),
        ...weekend.map((day) => ({
          day,
          start_time: '09:00:00',
          end_time: '23:00:00',
          duration: undefined,
          price: undefined,
          is_24hours: false,
          is_holiday: false,
        })),
      ];

      const activity = queryRunner.manager.create(Activity, {
        customer: savedCustomer as Customer,
        activity_name: 'Skiing',
        activity_type: ActivityType.SKIING,
        activity_description: 'Public skiing',
        base_price: 10,
        duration_hours: 3,
        start_date: START_DATE,
        end_date: END_DATE,
        slot_interval_minutes: 60,
        max_per_slot: 10,
        is_active: true,
        activity_tagline: undefined,
        activity_thumbnail_image: undefined,
        activity_image_gallery: undefined,
        safety_instructions: undefined,
        requires_waiver: false,
        provides_rentals: true,
        booking_type: BookingType.ANYTIME,
        redirect_to_external_website: false,
        external_booking_url: undefined,
        age_group: undefined,
        zones: [savedZone],
      } as Partial<Activity>);
      const savedActivity = await queryRunner.manager.save(Activity, activity);

      const schedules = scheduleRows.map((row) =>
        queryRunner.manager.create(ActivitySchedule, {
          ...row,
          activity: savedActivity,
        }),
      );
      await queryRunner.manager.save(ActivitySchedule, schedules);

      const inventory = queryRunner.manager.create(Inventory, {
        customer: savedCustomer as Customer,
        equipment_name: 'Ski Rentals',
        totalQuantity: 20,
        availableQuantity: 20,
        rental_price_per_hour: 15,
        description: undefined,
        thumbnailImageUrl: undefined,
      } as Partial<Inventory>);
      const savedInventory = await queryRunner.manager.save(
        Inventory,
        inventory,
      );

      const sizes: Partial<InventorySize>[] = [
        { size: 'S', quantity: 5, description: undefined },
        { size: 'M', quantity: 10, description: undefined },
        { size: 'L', quantity: 5, description: undefined },
      ];
      for (const s of sizes) {
        const sizeRow = queryRunner.manager.create(InventorySize, {
          ...s,
          inventory: savedInventory,
        });
        await queryRunner.manager.save(InventorySize, sizeRow);
      }

      await queryRunner.commitTransaction();

      return {
        customer_id: savedCustomer.id,
        admin_user_id: savedAdminUser.id,
        zone_id: savedZone.id,
        activity_id: savedActivity.id,
        message: `Skiing client onboarded. Admin login: ${email} / ${ADMIN_PASSWORD}`,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (
        err instanceof BadRequestException ||
        err instanceof InternalServerErrorException
      ) {
        throw err;
      }
      throw new InternalServerErrorException(
        err?.message || 'Onboarding failed',
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Reset admin password for an existing customer (dev only).
   * Use when an onboarded client cannot log in (e.g. password was not persisted).
   */
  async resetOnboardingAdminPassword(customerId: number): Promise<{ email: string; message: string }> {
    const user = await this.customerUserRepo.findOne({
      where: { customer: { id: customerId }, role: 'Admin' },
      relations: ['customer'],
    });
    if (!user) {
      throw new BadRequestException(
        `No Admin user found for customer id ${customerId}`,
      );
    }
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    user.password = hashedPassword;
    await this.customerUserRepo.save(user);
    return {
      email: user.email,
      message: `Password reset. Login with ${user.email} / ${ADMIN_PASSWORD}`,
    };
  }
}
