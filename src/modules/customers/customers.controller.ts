import { Controller, Get, Param  } from '@nestjs/common';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomerController {
  constructor(
    private readonly customerService: CustomersService,
  ) {}

  // @Get(':id')
  // async getCustomerById(@Param('id') id: string) {
  //   return this.customerService.findOneById(parseInt(id));
  // }
  
}
