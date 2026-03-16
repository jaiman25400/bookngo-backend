import { Activity } from '../../cms/activities/entities/activity.entity';
import { CustomerDetail } from '../../cms/customers/entities/customers-detail.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(CustomerDetail)
    private readonly customerDetailRepository: Repository<CustomerDetail>,
    @InjectRepository(Activity)
    private readonly ActivityRepository: Repository<Activity>,
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

      // Construct filtered customer object
      const filteredCustomerData = {
        customer_display_name: customerDetail.customer_display_name,
        customer_description: customerDetail.customer_description,
        customer_city: customerDetail.customer_city,
        home_image_url: customerDetail.home_image_url,
        about_us: customerDetail.about_us,
      };

      return {
        customerData: filteredCustomerData,
        activity: activityData,
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

  async getVendorActivityByID(activityId: number): Promise<Activity> {
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

      // Returns full activity with both thumbnail and gallery images
      return activity;
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
}
