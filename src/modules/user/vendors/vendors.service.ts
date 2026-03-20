import { Activity } from '../../cms/activities/entities/activity.entity';
import { CustomerDetail } from '../../cms/customers/entities/customers-detail.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadsService } from '../../storage/uploads.service';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(CustomerDetail)
    private readonly customerDetailRepository: Repository<CustomerDetail>,
    @InjectRepository(Activity)
    private readonly ActivityRepository: Repository<Activity>,
    private readonly uploads: UploadsService,
  ) {}

  async getVendorAllActivitiesByVendorSlug(slug: string): Promise<any> {
    if (!slug) {
      throw new HttpException(
        'Slug parameter is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Fetch customer detail with customer relation eagerly loaded
      const customerDetail = await this.customerDetailRepository.findOne({
        where: { customer_slug: slug },
        relations: ['customer'],
      });

      if (!customerDetail || !customerDetail.customer) {
        throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
      }

      // Fetch all activities linked to this customer
      const activityData = await this.ActivityRepository.find({
        where: { customer: { id: customerDetail.customer.id } },
        select: [
          'id',
          'activity_name',
          'base_price',
          'duration_hours',
          'activity_thumbnail_image',
        ],
      });

      const filteredCustomerData = {
        customer_display_name: customerDetail.customer_display_name,
        customer_description: customerDetail.customer_description,
        customer_city: customerDetail.customer_city,
        home_image_url:
          (await this.uploads.resolveDisplayUrl(customerDetail.home_image_url)) ??
          '',
        home_image_gallery: (
          await this.uploads.resolveDisplayUrlList(
            customerDetail.home_image_gallery,
          )
        ).filter((u): u is string => u != null),
        about_us: customerDetail.about_us,
      };

      const activityResolved = await Promise.all(
        activityData.map(async (a) => ({
          ...a,
          activity_thumbnail_image:
            (await this.uploads.resolveDisplayUrl(a.activity_thumbnail_image)) ??
            '',
        })),
      );

      return {
        customerData: filteredCustomerData,
        activity: activityResolved,
      };
    } catch (error) {
      console.error('Error retrieving customer activities:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getVendorActivityByID(activityId: number): Promise<any> {
    try {
      const activity = await this.ActivityRepository.findOne({
        where: { id: activityId },
        relations: ['zones', 'schedules', 'holidays'],
        // No select restriction - returns all fields including:
        // - activity_thumbnail_image (string)
        // - activity_image_gallery (string[])
      });

      if (!activity) {
        throw new HttpException('Activity not found', HttpStatus.NOT_FOUND);
      }

      return this.resolveActivityMediaForPublic(activity);
    } catch (error) {
      console.error('Error retrieving activity:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** Replace stored keys/paths with presigned or absolute URLs for the public site. */
  private async resolveActivityMediaForPublic(activity: Activity): Promise<any> {
    const zones = activity.zones;
    const resolvedZones = zones?.length
      ? await Promise.all(
          zones.map(async (zone) => ({
            ...zone,
            zone_thumbnail_image:
              (await this.uploads.resolveDisplayUrl(zone.zone_thumbnail_image)) ??
              '',
            zone_image_gallery: (
              await this.uploads.resolveDisplayUrlList(zone.zone_image_gallery)
            ).filter((u): u is string => u != null),
          })),
        )
      : zones;

    return {
      ...activity,
      activity_thumbnail_image:
        (await this.uploads.resolveDisplayUrl(
          activity.activity_thumbnail_image,
        )) ?? '',
      activity_image_gallery: (
        await this.uploads.resolveDisplayUrlList(activity.activity_image_gallery)
      ).filter((u): u is string => u != null),
      zones: resolvedZones,
    };
  }
}
