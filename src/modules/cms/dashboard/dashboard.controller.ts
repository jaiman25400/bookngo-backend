import {
  Controller,
  Get,
  Query,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardOverviewResponseDto } from './dto/dashboard-overview-response.dto';
import { DashboardBookingResponseDto } from './dto/dashboard-booking-response.dto';

@Controller('cms/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /cms/dashboard/overview
   * Returns today's bookings count for the summary card
   * Query params: ?date=2026-01-15 (optional, defaults to today)
   */
  @Get('overview')
  async getOverview(
    @Request() req,
    @Query('date') date?: string,
  ): Promise<DashboardOverviewResponseDto> {
    const customerId = req.user?.customer;
    if (!customerId) {
      throw new BadRequestException('Customer ID is missing for the user');
    }

    return this.dashboardService.getTodayBookingsCount(customerId, date);
  }

  /**
   * GET /cms/dashboard/bookings
   * Returns all bookings for a specific date
   * Frontend handles filtering by search and status
   * Query params:
   *   - date: YYYY-MM-DD (optional, defaults to today)
   */
  @Get('bookings')
  async getBookings(
    @Request() req,
    @Query('date') date?: string,
  ): Promise<DashboardBookingResponseDto[]> {
    const customerId = req.user?.customer;
    if (!customerId) {
      throw new BadRequestException('Customer ID is missing for the user');
    }

    return this.dashboardService.getBookings(customerId, date);
  }
}
