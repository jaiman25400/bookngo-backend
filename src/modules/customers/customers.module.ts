import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomerController } from './customers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customers.entity'; // Import Customer entity
import { CustomerDetail } from './entities/customers-detail.entity';


@Module({
  imports: [TypeOrmModule.forFeature([Customer, CustomerDetail])],
  providers: [CustomersService],
  controllers: [CustomerController]
})
export class CustomersModule {}
