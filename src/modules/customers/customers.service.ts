import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customers.entity'; // assuming the customer entity is in the 'customer.entity.ts' file

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}
  async findOneByEmail(email: string): Promise<Customer | null> {
    return this.customerRepository.findOne({ where: { email } });
  }

  async findOneById(id: number): Promise<Customer | null> {
    return this.customerRepository.findOne({ where: { id } });
  }

}
