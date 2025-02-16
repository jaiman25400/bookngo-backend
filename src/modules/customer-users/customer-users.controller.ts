import {
  Controller,
  Post,
  Body,
  Get,
  Query
} from '@nestjs/common';
import { CustomerUsersService } from './customer-users.service';
import { InviteUserDto } from './dto/invite-user.dto'; // Import DTO

@Controller('customer-users')
export class CustomerUsersController {
  constructor(private readonly customerUsersService: CustomerUsersService) {}

  // Invite user & send email
  @Post('invite')
  async inviteUser(@Body() body: InviteUserDto) {
    return this.customerUsersService.inviteUser(
      body.email,
      body.name,
      body.customerId,
      body.role,
    );
  }

  // Set password after user clicks the email link
  @Post('set-password')
  async setPassword(@Body() body: { token: string; password: string }) {
    return this.customerUsersService.setPassword(body.token, body.password);
  }

 // Accept customer_id from query params (GET request)
 @Get('getTeam')
 async getTeam(@Query('customer_id') customerId: number) {
   if (!customerId) {
     return { message: 'Customer ID is required' };
   }

   return this.customerUsersService.getTeam(customerId);
 }
}
