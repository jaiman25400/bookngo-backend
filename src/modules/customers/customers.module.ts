import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomerController } from './customers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './customers.entity'; // Import Customer entity


@Module({
  imports: [TypeOrmModule.forFeature([Customer])],
  providers: [CustomersService],
  controllers: [CustomerController]
})
export class CustomersModule {}
