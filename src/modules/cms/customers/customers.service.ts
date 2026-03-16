import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customers.entity'; // assuming the customer entity is in the 'customer.entity.ts' file
import { CustomerDetail } from './entities/customers-detail.entity';
import { CreateCustomerDetailDto } from './dto/create-customer-detail.dto';
import {
  deleteFileIfExists,
  deleteMultipleFilesIfExist,
} from '../../../utils/common.helper';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(CustomerDetail)
    private customerDetailRepository: Repository<CustomerDetail>,
  ) {}

  async findOneCustomerById(id: number): Promise<Customer | null> {
    return this.customerRepository.findOne({ where: { id } });
  }

  async findOneCustomerDetailById(customerId: number) {
    // Return type should not include "null" if you handle errors
    const detail = await this.customerDetailRepository.findOne({
      where: { customer: { id: customerId } },
    });

    return detail;
  }

  // async createCustomerDetail(
  //   customerId: number,
  //   createCustomerDetailDto: CreateCustomerDetailDto & {
  //     home_image_url?: string;
  //     home_image_gallery?: string[];
  //   },
  // ): Promise<CustomerDetail> {
  //   const customer = await this.customerRepository.findOne({
  //     where: { id: customerId },
  //   });

  //   if (!customer) {
  //     throw new NotFoundException('Customer not found');
  //   }

  //   const customerDetail = this.customerDetailRepository.create({
  //     ...createCustomerDetailDto,
  //     customer,
  //   });

  //   await this.customerDetailRepository.save(customerDetail);

  //   // Update customer with detail reference
  //   customer.detail = customerDetail;
  //   await this.customerRepository.save(customer);

  //   return customerDetail;
  // }

  async updateCustomerDetail(
    customerId: number,
    updateDto: CreateCustomerDetailDto & {
      home_image_url?: string;
      home_image_gallery?: string[];
    },
  ): Promise<CustomerDetail> {
    try {
      console.log('Cust ID :', customerId);
      const customer = await this.customerRepository.findOne({
        where: { id: customerId },
        relations: ['detail'],
      });

      if (!customer || !customer.detail) {
        throw new NotFoundException('Customer or customer detail not found');
      }
      const detail = customer.detail;

      // ✅ Handle thumbnail update
      if (updateDto.home_image_url !== undefined && detail.home_image_url) {
        await deleteFileIfExists(detail.home_image_url);
        detail.home_image_url = updateDto.home_image_url;
      }

      // ✅ Handle gallery update
      if (
        updateDto.home_image_gallery !== undefined &&
        detail.home_image_gallery
      ) {
        await deleteMultipleFilesIfExist(detail.home_image_gallery);
        detail.home_image_gallery = updateDto.home_image_gallery;
      }

      // ✅ Merge other updates
      Object.assign(detail, updateDto);

      return await this.customerDetailRepository.save(detail);
    } catch (error) {
      // Optional: log or transform error if needed
      throw new InternalServerErrorException(
        error.message || 'Failed to update customer detail',
      );
    }
  }
}
