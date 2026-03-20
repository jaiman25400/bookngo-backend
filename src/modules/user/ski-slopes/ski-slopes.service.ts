import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerDetail } from '../../cms/customers/entities/customers-detail.entity';
import { ActivityType } from '../../cms/activities/enums/activity-type.enum';
import { UploadsService } from '../../storage/uploads.service';

@Injectable()
export class SkiSlopesService {
  private readonly logger = new Logger(SkiSlopesService.name);

  constructor(
    @InjectRepository(CustomerDetail)
    private readonly customerDetailRepository: Repository<CustomerDetail>,
    private readonly uploads: UploadsService,
  ) {}

  async getByRegion(
    region: string,
    activityType?: ActivityType,
  ): Promise<{
    region: string;
    count: number;
    results: CustomerDetail[];
  }> {
    if (!region) {
      throw new HttpException(
        'Region parameter is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      if (!activityType) {
        const results = await this.customerDetailRepository.find({
          where: { customer_state: region },
        });
        return { region, count: results.length, results };
      }

      const qb = this.customerDetailRepository
        .createQueryBuilder('detail')
        .innerJoin('detail.customer', 'customer')
        .innerJoin(
          'Activity',
          'activity',
          'activity.customerId = customer.id AND activity.activity_type = :activityType AND activity.is_active = :isActive',
          { activityType, isActive: true },
        )
        .where('detail.customer_state = :region', { region })
        .distinctOn(['customer.id']);

      const results = await qb.getMany();
      return { region, count: results.length, results };
    } catch (error) {
      this.logger.error(
        `Failed to fetch customers for region ${region}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to retrieve customer data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCustomersForSkiingOrSnowboarding(): Promise<
    Array<{
      name: string;
      latitude: number;
      longitude: number;
      city: string;
      customer_image: string;
      slug: string;
    }>
  > {
    try {
      const results = await this.customerDetailRepository
        .createQueryBuilder('detail')
        .innerJoin('detail.customer', 'customer')
        .innerJoin(
          'Activity', // Use entity name directly
          'activity',
          'activity.customerId = customer.id AND activity.activity_type IN (:...types) AND activity.is_active = :isActive',
          {
            types: [ActivityType.SKIING, ActivityType.SNOWBOARDING],
            isActive: true,
          },
        )
        .select([
          'detail.customer_display_name AS name',
          'detail.customer_latitude AS latitude',
          'detail.customer_longitude AS longitude',
          'detail.customer_city AS city',
          'detail.home_image_url AS customer_image',
          'detail.customer_slug AS customer_slug',
        ])
        .where('detail.customer_latitude IS NOT NULL')
        .andWhere('detail.customer_longitude IS NOT NULL')
        .distinctOn(['customer.id'])
        .getRawMany();

      return Promise.all(
        results.map(async (item) => ({
          name: item.name,
          latitude: Number(item.latitude),
          longitude: Number(item.longitude),
          city: item.city,
          customer_image:
            (await this.uploads.resolveDisplayUrl(item.customer_image)) ?? '',
          slug: item.customer_slug,
        })),
      );
    } catch (error) {
      console.error('Database error:', error);
      throw new HttpException(
        'Failed to retrieve customer data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCustomersForIceSkating(): Promise<
    Array<{
      name: string;
      latitude: number;
      longitude: number;
      city: string;
      customer_image: string;
      slug: string;
    }>
  > {
    try {
      const results = await this.customerDetailRepository
        .createQueryBuilder('detail')
        .innerJoin('detail.customer', 'customer')
        .innerJoin(
          'Activity',
          'activity',
          'activity.customerId = customer.id AND activity.activity_type = :activityType AND activity.is_active = :isActive',
          {
            activityType: ActivityType.SKATING,
            isActive: true,
          },
        )
        .select([
          'detail.customer_display_name AS name',
          'detail.customer_latitude AS latitude',
          'detail.customer_longitude AS longitude',
          'detail.customer_city AS city',
          'detail.home_image_url AS customer_image',
          'detail.customer_slug AS customer_slug',
        ])
        .where('detail.customer_latitude IS NOT NULL')
        .andWhere('detail.customer_longitude IS NOT NULL')
        .distinctOn(['customer.id'])
        .getRawMany();

      return Promise.all(
        results.map(async (item) => ({
          name: item.name,
          latitude: Number(item.latitude),
          longitude: Number(item.longitude),
          city: item.city,
          customer_image:
            (await this.uploads.resolveDisplayUrl(item.customer_image)) ?? '',
          slug: item.customer_slug,
        })),
      );
    } catch (error) {
      console.error('Database error:', error);
      throw new HttpException(
        'Failed to retrieve customer data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
