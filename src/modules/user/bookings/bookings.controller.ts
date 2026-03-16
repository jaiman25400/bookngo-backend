// bookings.controller.ts
import {
  Controller,
  Get,
  Query,
  NotFoundException,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Public } from '../../cms/auth/public.decorator';

@Controller('user/bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Public()
  @Get('rentals/customerSlug')
  async getInventoryByCustomerSlug(
    @Query('slug') customerSlug: string,
    @Query('bookingDate')
    bookingDate: string,
    @Query('bookingTime') bookingTime: string,
    @Query('activityId') activityId: string,
  ) {
    try {
      return await this.bookingsService.getInventoryUsingCustomerSlug(
        customerSlug,
        bookingDate,
        bookingTime,
        activityId,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Public()
  @Post('proceedToCheckout')
  async createBooking(@Body() createDto: any) {
    try {
      const booking = await this.bookingsService.createBooking(createDto);
      return {
        success: true,
        message: 'Booking created successfully!',
        BookingID: booking.id,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create booking');
    }
  }

  @Public()
  @Post('confirmBooking')
  async confirmBooking(@Body() confirmDto: { bookingId: string }) {
    try {
      console.log('Confirming booking with ID:', confirmDto.bookingId);
      const result = await this.bookingsService.confirmBooking(
        confirmDto.bookingId,
      );
      return {
        success: true,
        message: 'Booking confirmed successfully!',
        data: result,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to confirm booking');
    }
  }

  @Public()
  @Get('bookingID') // Add :bookingId to path
  async getBookingDetailByID(@Query('id') bookingID: string) {
    console.log('Booking ID:', bookingID);
    try {
      const booking =
        await this.bookingsService.getBookingDetailByID(bookingID);
      if (!booking || booking === undefined) {
        throw new NotFoundException(`Booking ${bookingID} not found`);
      }
      return booking;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch booking');
    }
  }

  @Public()
  @Get('check-availability')
  async returnSlotAvailabilityByDate(@Query() query: any) {
    try {
      console.log(
        `Checking availability for date: ${query.date}, activityId: ${query.activityId}`,
      );
      const availability =
        await this.bookingsService.returnSlotAvailabilityByDate(
          query.date,
          query.activityId,
        );
      return {
        success: true,
        data: availability,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to check slot availability');
    }
  }
}
