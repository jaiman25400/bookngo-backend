import {
  Controller,
  Post,
  Body,
  Get,
  Request,
  Logger,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { CustomerUsersService } from './customer-users.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { Public } from '../auth/public.decorator';

@Controller('customer-users')
export class CustomerUsersController {
  private readonly logger = new Logger(CustomerUsersController.name);

  constructor(private readonly customerUsersService: CustomerUsersService) {}

  /**
   * Invite user & send email
   */

  @Post('invite')
  async inviteUser(@Body() inviteUserDto: InviteUserDto, @Request() req) {
    try {
      const result = await this.customerUsersService.inviteUser(
        inviteUserDto.email,
        inviteUserDto.name,
        req.user?.customer,
        inviteUserDto.role,
      );

      return {
        message: 'Invitation sent successfully',
        data: result,
      };
    } catch (error) {
      // Preserve existing HTTP exceptions
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to send invitation');
    }
  }

  @Public()
  @Post('inviteUserByAdmin')
  async inviteUserByAdmin(@Body() inviteUserDto: any) {
    try {
      console.log(inviteUserDto);
      const result = await this.customerUsersService.inviteUser(
        inviteUserDto.email,
        inviteUserDto.name,
        inviteUserDto.customer,
        inviteUserDto.role,
      );

      return {
        message: 'Invitation sent successfully',
        data: result,
      };
    } catch (error) {
      // Preserve existing HTTP exceptions
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to send invitation');
    }
  }
  /**
   * Set password after user clicks the email link
   */
  @Public()
  @Post('set-password')
  async setPassword(@Body() body: SetPasswordDto) {
    try {
      if (!body.token || !body.password) {
        throw new BadRequestException('Token and password are required');
      }

      const result = await this.customerUsersService.setPassword(
        body.token,
        body.password,
      );

      if (!result) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      return {
        message: 'Password set successfully',
      };
    } catch (error) {
      this.logger.error('Error setting password', error.stack);

      if (error instanceof UnauthorizedException) throw error;

      throw new InternalServerErrorException('Failed to set password');
    }
  }

  /**
   * Get team members by customer_id from query params (GET request)
   */

  @Get('getTeam')
  async getTeam(@Request() req) {
    try {
      const customerId = req.user?.customer;

      if (!customerId) {
        this.logger.warn('Customer ID is missing from the request');
        throw new BadRequestException('Customer ID is required');
      }

      const team = await this.customerUsersService.getTeam(customerId);

      return {
        message: 'Team retrieved successfully',
        data: team,
      };
    } catch (error) {
      this.logger.error('Error fetching team data', error.stack);
      throw new InternalServerErrorException('Failed to retrieve team');
    }
  }
}
