import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { CmsBookingsService } from './bookings.service';
import { CheckInDto } from './dto/check-in.dto';

@Controller('cms/bookings')
export class CmsBookingsController {
  constructor(private readonly cmsBookingsService: CmsBookingsService) {}

  /**
   * GET /cms/bookings/activity/:activityId
   * Returns activity details scoped to the logged-in customer
   */
  @Get('activity/:activityId')
  async getActivity(
    @Param('activityId') activityId: number,
    @Request() req,
  ) {
    const customerId = req.user?.customer;
    if (!customerId) {
      throw new BadRequestException('Customer ID is missing for the user');
    }

    return this.cmsBookingsService.getActivityForCustomer(
      customerId,
      Number(activityId),
    );
  }

  /**
   * GET /cms/bookings/check-availability?date=YYYY-MM-DD&activityId=123
   */
  @Get('check-availability')
  async getAvailability(
    @Query('date') date: string,
    @Query('activityId') activityId: string,
    @Request() req,
  ) {
    const customerId = req.user?.customer;
    if (!customerId) {
      throw new BadRequestException('Customer ID is missing for the user');
    }

    if (!date || !activityId) {
      throw new BadRequestException('date and activityId are required');
    }

    return this.cmsBookingsService.getAvailabilityForCustomer(
      customerId,
      date,
      Number(activityId),
    );
  }

  /**
   * GET /cms/bookings/rentals?activityId=123&bookingDate=YYYY-MM-DD&bookingTime=HH:mm:ss
   */
  @Get('rentals')
  async getRentals(
    @Query('activityId') activityId: string,
    @Query('bookingDate') bookingDate: string,
    @Query('bookingTime') bookingTime: string,
    @Request() req,
  ) {
    const customerId = req.user?.customer;
    if (!customerId) {
      throw new BadRequestException('Customer ID is missing for the user');
    }

    if (!activityId || !bookingDate || !bookingTime) {
      throw new BadRequestException(
        'activityId, bookingDate, and bookingTime are required',
      );
    }

    return this.cmsBookingsService.getRentalsForCustomer(
      customerId,
      Number(activityId),
      bookingDate,
      bookingTime,
    );
  }

  /**
   * POST /cms/bookings/proceedToCheckout
   * Same payload as user flow, scoped to customer
   */
  @Post('proceedToCheckout')
  async proceedToCheckout(@Request() req, @Body() payload: any) {
    const customerId = req.user?.customer;
    if (!customerId) {
      throw new BadRequestException('Customer ID is missing for the user');
    }

    return this.cmsBookingsService.proceedToCheckoutForCustomer(
      customerId,
      payload,
    );
  }

  /**
   * POST /cms/bookings/confirmBooking
   */
  @Post('confirmBooking')
  async confirmBooking(
    @Request() req,
    @Body() payload: { bookingId: string },
  ) {
    const customerId = req.user?.customer;
    if (!customerId) {
      throw new BadRequestException('Customer ID is missing for the user');
    }

    if (!payload?.bookingId) {
      throw new BadRequestException('bookingId is required');
    }

    return this.cmsBookingsService.confirmBookingForCustomer(
      customerId,
      payload.bookingId,
    );
  }

  /**
   * GET /cms/bookings/:id
   * Returns booking details for check-in modal
   */
  @Get(':id')
  async getBookingDetails(@Param('id') id: string, @Request() req) {
    const customerId = req.user?.customer;
    if (!customerId) {
      throw new BadRequestException('Customer ID is missing for the user');
    }

    return this.cmsBookingsService.getBookingDetailsForCustomer(
      customerId,
      id,
    );
  }

  /**
   * PATCH /cms/bookings/:id/check-in
   * Marks a confirmed booking as CHECKED_IN
   */
  @Patch(':id/check-in')
  async checkInBooking(
    @Param('id') id: string,
    @Request() req,
    @Body() payload: CheckInDto,
  ) {
    const customerId = req.user?.customer;
    if (!customerId) {
      throw new BadRequestException('Customer ID is missing for the user');
    }

    const checkedInBy = req.user?.sub ?? null;

    return this.cmsBookingsService.checkInBooking(
      id,
      customerId,
      checkedInBy,
      payload,
    );
  }
}
