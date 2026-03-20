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
import { UploadsService } from '../../storage/uploads.service';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(CustomerDetail)
    private customerDetailRepository: Repository<CustomerDetail>,
    private readonly uploads: UploadsService,
  ) {}

  async findOneCustomerById(id: number): Promise<Customer | null> {
    return this.customerRepository.findOne({ where: { id } });
  }

  async findOneCustomerDetailById(customerId: number) {
    const detail = await this.customerDetailRepository.findOne({
      where: { customer: { id: customerId } },
    });

    if (!detail) return detail;

    return {
      ...detail,
      home_image_url:
        (await this.uploads.resolveDisplayUrl(detail.home_image_url)) ?? '',
      home_image_gallery: (
        await this.uploads.resolveDisplayUrlList(detail.home_image_gallery)
      ).filter((u): u is string => u != null),
    };
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

      if (updateDto.home_image_url !== undefined) {
        await this.uploads.deleteStored(detail.home_image_url);
      }
      if (
        updateDto.home_image_gallery !== undefined &&
        detail.home_image_gallery?.length
      ) {
        await this.uploads.deleteManyStored(detail.home_image_gallery);
      }

      Object.assign(detail, updateDto);

      const saved = await this.customerDetailRepository.save(detail);
      return {
        ...saved,
        home_image_url:
          (await this.uploads.resolveDisplayUrl(saved.home_image_url)) ?? '',
        home_image_gallery: (
          await this.uploads.resolveDisplayUrlList(saved.home_image_gallery)
        ).filter((u): u is string => u != null),
      };
    } catch (error) {
      // Optional: log or transform error if needed
      throw new InternalServerErrorException(
        error.message || 'Failed to update customer detail',
      );
    }
  }
}
