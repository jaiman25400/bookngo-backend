import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking_logs } from '@/modules/user/bookings/entities/booking_logs.entity';
import { Activity } from '@/modules/cms/activities/entities/activity.entity';
import { CustomerDetail } from '@/modules/cms/customers/entities/customers-detail.entity';
import { BookingsService } from '@/modules/user/bookings/bookings.service';
import { CheckInDto } from './dto/check-in.dto';

@Injectable()
export class CmsBookingsService {
  constructor(
    @InjectRepository(Booking_logs)
    private readonly bookingRepository: Repository<Booking_logs>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(CustomerDetail)
    private readonly customerDetailRepository: Repository<CustomerDetail>,
    private readonly bookingsService: BookingsService,
  ) {}

  async getActivityForCustomer(customerId: number, activityId: number) {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
      relations: ['customer', 'zones', 'schedules', 'holidays'],
    });

    if (!activity) {
      throw new NotFoundException(`Activity ${activityId} not found`);
    }

    if (activity.customer?.id !== customerId) {
      throw new BadRequestException(
        'You are not allowed to access this activity',
      );
    }

    return activity;
  }

  async getAvailabilityForCustomer(
    customerId: number,
    date: string,
    activityId: number,
  ) {
    await this.getActivityForCustomer(customerId, activityId);
    return this.bookingsService.returnSlotAvailabilityByDate(date, activityId);
  }

  async getRentalsForCustomer(
    customerId: number,
    activityId: number,
    bookingDate: string,
    bookingTime: string,
  ) {
    await this.getActivityForCustomer(customerId, activityId);

    const customerDetail = await this.customerDetailRepository.findOne({
      where: { customer: { id: customerId } },
      relations: ['customer'],
    });

    if (!customerDetail?.customer_slug) {
      throw new BadRequestException('Customer slug not found');
    }

    return this.bookingsService.getInventoryUsingCustomerSlug(
      customerDetail.customer_slug,
      bookingDate,
      bookingTime,
      activityId.toString(),
    );
  }

  async proceedToCheckoutForCustomer(customerId: number, payload: any) {
    const activityId = Number(payload?.activityId);
    if (!activityId) {
      throw new BadRequestException('Activity ID is required');
    }

    await this.getActivityForCustomer(customerId, activityId);

    const customerDetail = await this.customerDetailRepository.findOne({
      where: { customer: { id: customerId } },
      relations: ['customer'],
    });

    if (!customerDetail?.customer_slug) {
      throw new BadRequestException('Customer slug not found');
    }

    const createDto = {
      ...payload,
      activityId: activityId.toString(),
      vendorSlug: customerDetail.customer_slug,
    };

    return this.bookingsService.createBooking(createDto);
  }

  async confirmBookingForCustomer(customerId: number, bookingId: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, customerId: customerId.toString() },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    return this.bookingsService.confirmBooking(bookingId);
  }

  async getBookingDetailsForCustomer(customerId: number, bookingId: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, customerId: customerId.toString() },
      relations: ['rentals'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    const activity = await this.activityRepository.findOne({
      where: { id: booking.activityId },
      relations: ['customer'],
    });

    if (!activity) {
      throw new NotFoundException(
        `Activity with ID ${booking.activityId} not found`,
      );
    }

    if (activity.customer?.id !== customerId) {
      throw new BadRequestException(
        'You do not have permission to access this booking',
      );
    }

    const startTime = booking.bookingTime;
    const timeParts = startTime.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1] || '0', 10);
    const startDateTime = new Date();
    startDateTime.setHours(hours, minutes, 0, 0);
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(startDateTime.getHours() + activity.duration_hours);
    const formattedStartTime = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;
    const endHours = endDateTime.getHours();
    const endMinutes = endDateTime.getMinutes();
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes
      .toString()
      .padStart(2, '0')}`;
    const timeSlot = `${formattedStartTime} - ${endTime}`;

    const activityPrice =
      parseFloat(booking.activity_base_price || '0') *
      booking.numberOfTickets;
    const rentalPrice = (booking.rentals || []).reduce((sum, rental) => {
      const price = parseFloat(rental.price?.toString() || '0');
      return sum + price * rental.quantity;
    }, 0);
    const totalPrice = activityPrice + rentalPrice;

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
      price: Math.round(totalPrice * 100) / 100,
      activityPrice: Math.round(activityPrice * 100) / 100,
      rentalPrice: Math.round(rentalPrice * 100) / 100,
      bookingDate: booking.bookingDate,
      createdAt: booking.createdAt,
      rentals: (booking.rentals || []).map((rental) => ({
        equipmentId: rental.equipmentId,
        equipmentName: rental.name,
        sizeId: Number(rental.sizeId),
        sizeValue: rental.sizeValue,
        quantity: rental.quantity,
        price: parseFloat(rental.price?.toString() || '0'),
      })),
      requiresWaiver: activity.requires_waiver,
      waiverSigned: booking.waiverSigned,
      waiverSignedAt: booking.waiverSignedAt,
      checkedInAt: booking.checkedInAt,
      checkedInBy: booking.checkedInBy,
    };
  }

  async checkInBooking(
    bookingId: string,
    customerId: number,
    checkedInBy: number | null,
    payload: CheckInDto,
  ) {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, customerId: customerId.toString() },
      relations: ['rentals'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Cannot check in a cancelled booking');
    }

    if (booking.status === 'COMPLETED') {
      throw new BadRequestException('Booking is already completed');
    }

    if (booking.status === 'STAGED') {
      throw new BadRequestException('Booking is not confirmed yet');
    }

    if (booking.status === 'CHECKED_IN') {
      return booking;
    }

    if (payload.paymentVerified !== undefined) {
      booking.paymentStatus = payload.paymentVerified;
    }

    if (payload.waiverSigned !== undefined) {
      booking.waiverSigned = payload.waiverSigned;
      booking.waiverSignedAt = payload.waiverSigned ? new Date() : null;
    }

    booking.status = 'CHECKED_IN';
    booking.checkedInAt = new Date();
    booking.checkedInBy = checkedInBy;

    return this.bookingRepository.save(booking);
  }
}
