import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking_logs } from '@/modules/user/bookings/entities/booking_logs.entity';
import { Activity } from '../activities/entities/activity.entity';
import { format, addHours } from 'date-fns';
import { DashboardBookingResponseDto } from './dto/dashboard-booking-response.dto';
import { DashboardOverviewResponseDto } from './dto/dashboard-overview-response.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Booking_logs)
    private readonly bookingRepository: Repository<Booking_logs>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  /**
   * Get today's bookings count for the summary card
   */
  async getTodayBookingsCount(
    customerId: number,
    date?: string,
  ): Promise<DashboardOverviewResponseDto> {
    const targetDate = date || format(new Date(), 'yyyy-MM-dd');

    const [total, confirmed, checkedIn, staged, cancelled, completed] =
      await Promise.all([
        this.bookingRepository.count({
          where: {
            customerId: customerId.toString(),
            bookingDate: targetDate,
          },
        }),
        this.bookingRepository.count({
          where: {
            customerId: customerId.toString(),
            bookingDate: targetDate,
            status: 'CONFIRMED',
          },
        }),
        this.bookingRepository.count({
          where: {
            customerId: customerId.toString(),
            bookingDate: targetDate,
            status: 'CHECKED_IN',
          },
        }),
        this.bookingRepository.count({
          where: {
            customerId: customerId.toString(),
            bookingDate: targetDate,
            status: 'STAGED',
          },
        }),
        this.bookingRepository.count({
          where: {
            customerId: customerId.toString(),
            bookingDate: targetDate,
            status: 'CANCELLED',
          },
        }),
        this.bookingRepository.count({
          where: {
            customerId: customerId.toString(),
            bookingDate: targetDate,
            status: 'COMPLETED',
          },
        }),
      ]);

    return {
      date: targetDate,
      totalBookings: total,
      confirmedBookings: confirmed,
      checkedInBookings: checkedIn,
      stagedBookings: staged,
      cancelledBookings: cancelled,
      completedBookings: completed,
    };
  }

  /**
   * Get all bookings for a specific date
   * Frontend handles filtering by search and status
   */
  async getBookings(
    customerId: number,
    date?: string,
  ): Promise<DashboardBookingResponseDto[]> {
    const targetDate = date || format(new Date(), 'yyyy-MM-dd');

    // Get all bookings for the date - frontend will handle filtering
    const bookings = await this.bookingRepository.find({
      where: {
        customerId: customerId.toString(),
        bookingDate: targetDate,
      },
      relations: ['rentals'],
      order: {
        bookingTime: 'ASC',
      },
    });

    // Fetch activities in batch for better performance
    const activityIds = [...new Set(bookings.map((b) => b.activityId))];
    const activities = await this.activityRepository.find({
      where: activityIds.map((id) => ({ id })),
    });

    const activityMap = new Map(activities.map((a) => [a.id, a]));

    // Transform bookings to response DTOs
    return bookings.map((booking) => {
      const activity = activityMap.get(booking.activityId);
      if (!activity) {
        throw new NotFoundException(
          `Activity with ID ${booking.activityId} not found`,
        );
      }

      // Calculate end time based on activity duration
      const startTime = booking.bookingTime;
      // Handle both HH:mm:ss and HH:mm formats
      const timeParts = startTime.split(':');
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1] || '0', 10);

      // Create a date object for time calculation
      const startDateTime = new Date();
      startDateTime.setHours(hours, minutes, 0, 0);
      const endDateTime = addHours(startDateTime, activity.duration_hours);

      // Format times
      const formattedStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const endHours = endDateTime.getHours();
      const endMinutes = endDateTime.getMinutes();
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
      const timeSlot = `${formattedStartTime} - ${endTime}`;

      // Calculate prices
      const activityPrice =
        parseFloat(booking.activity_base_price || '0') *
        booking.numberOfTickets;
      const rentalPrice = (booking.rentals || []).reduce(
        (sum, rental) =>
          sum + parseFloat(rental.price.toString() || '0') * rental.quantity,
        0,
      );
      const totalPrice = activityPrice + rentalPrice;

      // Format confirmation ID (BK-XXXXXX format)
      // Use last 6 characters of UUID, pad with zeros if needed
      const idSuffix = booking.id.replace(/-/g, '').slice(-6).toUpperCase();
      const confirmationId = `BK-${idSuffix}`;

      return {
        id: booking.id,
        confirmationId,
        customerName: booking.user_name,
        customerEmail: booking.user_email,
        customerPhone: booking.user_phone,
        activityName: activity.activity_name,
        activityId: booking.activityId,
        zoneName: booking.zoneName,
        zoneId: booking.zoneId,
        timeSlot,
        startTime: formattedStartTime,
        endTime,
        participants: booking.numberOfTickets,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        waiverSigned: booking.waiverSigned,
        waiverSignedAt: booking.waiverSignedAt,
        checkedInAt: booking.checkedInAt,
        price: Math.round(totalPrice * 100) / 100, // Round to 2 decimal places
        activityPrice: Math.round(activityPrice * 100) / 100,
        rentalPrice: Math.round(rentalPrice * 100) / 100,
        bookingDate: booking.bookingDate,
        createdAt: booking.createdAt,
      };
    });
  }
}
