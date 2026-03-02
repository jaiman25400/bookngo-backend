// bookings.service.ts
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from '@/modules/cms/inventory/entities/inventory.entity';
import { CustomerDetail } from '@/modules/cms/customers/entities/customers-detail.entity';
import { Injectable } from '@nestjs/common';
import { Booking_logs } from './entities/booking_logs.entity';
import { BookingRentalLogs } from './entities/booking_rentals_logs.entity';
import { Activity } from '@/modules/cms/activities/entities/activity.entity';
import { BookingActivityLogs } from './entities/booking_activity_logs.entity';
import { ActivityRentalReservation } from './entities/booking_activity_rentals_logs.entity';
import { InventorySize } from '@/modules/cms/inventory/entities/inventory-size.entity';
import { format } from 'date-fns';
import * as dayjs from 'dayjs';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,

    @InjectRepository(CustomerDetail) // Ensure this matches
    private readonly customerDetailRepository: Repository<CustomerDetail>,

    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,

    @InjectRepository(Booking_logs)
    private bookingRepo: Repository<Booking_logs>,

    @InjectRepository(BookingRentalLogs)
    private rentalRepo: Repository<BookingRentalLogs>,

    @InjectRepository(BookingActivityLogs)
    private bookingActivityLogs: Repository<BookingActivityLogs>,

    @InjectRepository(ActivityRentalReservation)
    private activityRentalReservationRepo: Repository<ActivityRentalReservation>,

    @InjectRepository(InventorySize)
    private inventorySizeRepo: Repository<InventorySize>,
  ) {}

  async getInventoryUsingCustomerSlug(
    slug: string,
    bookingDate: string,
    bookingTime: string,
    activityId: string,
  ): Promise<any[]> {
    const customerDetail = await this.customerDetailRepository.findOne({
      where: { customer_slug: slug },
      relations: ['customer'],
    });

    if (!customerDetail) {
      throw new NotFoundException('Customer not found with the provided slug');
    }

    const customerId = customerDetail.customer.id;

    // Fetch activity to ensure it exists
    const activity = await this.activityRepository.findOne({
      where: { id: Number(activityId) },
      relations: ['customer'],
    });

    if (!activity) {
      throw new NotFoundException(`Activity ${activityId} not found`);
    }

    // Validate activity duration
    if (!activity.duration_hours) {
      throw new BadRequestException('Activity duration not configured');
    }

    const inventories = await this.inventoryRepository.find({
      where: { customer: { id: customerId } },
      relations: ['sizes'],
    });

    if (!inventories || inventories.length === 0) {
      throw new NotFoundException('No inventory found for this customer');
    }

    const today = bookingDate.toString().split('T')[0]; // 'YYYY-MM-DD'

    const inventoryDataWithAvailability: any[] = [];

    for (const inventory of inventories) {
      const updatedSizes: any[] = [];

      // console.log('Processing inventory:', inventory, 'Sizes:', inventory.sizes);

      for (const size of inventory.sizes) {
        // Fetch all CONFIRMED reservations for this size on today's date (can be extended)
        const reservations = await this.activityRentalReservationRepo.find({
          where: {
            inventory_id: inventory.id,
            size_id: size.id,
            slot_date: today,
            status: 'CONFIRMED',
          },
        });

        console.log(
          'Reservations for size :',
          size.size,
          'Reservation : ',
          reservations,
        );
        // For below filter we have bookingTime (09:00:00) as start time and end time as start time + activity duration need be in same format
        // e.g. bookingTime = 09:00:00, activityDuration = 60 minutes
        // So end time will be 10:00:00
        // We need to filter reservations that overlap with this time window
        // const startTime = bookingTime; // e.g. '09:00:00'

        // const endTime = dayjs(bookingDate)
        //   .add(activityDuration, 'minute')
        //   .format('HH:mm:ss'); // e.g. '10:00:00'

        const [hours, minutes] = bookingTime.split(':').map(Number);
        const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        const endHours = hours + activity.duration_hours;
        const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

        console.log('Start Time:', startTime);
        console.log('End Time:', endTime);

        // Filter overlapping reservations
        const overlappingReservations = reservations.filter((reservation) => {
          return (
            reservation.start_time <= endTime &&
            reservation.end_time >= startTime
          );
        });

        // Calculate total reserved quantity
        const totalReserved = overlappingReservations.reduce(
          (sum, res) => sum + res.rental_booked_count,
          0,
        );

        console.log(`Total reserved for size ${size.size}:`, totalReserved);

        updatedSizes.push({
          ...size,
          maxQuantity: size.quantity,
          availableQuantity: Math.max(size.quantity - totalReserved, 0),
        });
      }

      inventoryDataWithAvailability.push({
        ...inventory,
        sizes: updatedSizes,
      });
    }

    return inventoryDataWithAvailability;
  }

  async createBooking(createDto: any) {
    // Fetch activity with customer relation
    console.log('Create Booking DTO:', createDto);

    if (!createDto.activityId || !createDto.userDetails) {
      throw new BadRequestException(
        'Activity ID and user details are required',
      );
    }

    const activity = await this.activityRepository.findOne({
      where: { id: Number(createDto.activityId) },
      relations: ['customer'],
    });

    if (!activity) {
      throw new Error(`Activity with ID ${createDto.activityId} not found`);
    }
    // Create booking entity with customer ID from activity
    const booking = this.bookingRepo.create({
      customerId: activity.customer.id.toString(), // ✅ Get from activity
      user_name: createDto.userDetails.name,
      user_email: createDto.userDetails.email,
      user_phone: createDto.userDetails.phone,
      activityId: Number(createDto.activityId),
      activity_base_price: activity.base_price.toString(),
      vendorSlug: createDto.vendorSlug,
      zoneId: createDto.zoneId,
      zoneName: createDto.zoneName,
      bookingDate: createDto.date,
      bookingTime: createDto.time,
      numberOfTickets: Number(createDto.tickets),
      status: 'STAGED',
      paymentStatus: false,
    });

    const savedBooking = await this.bookingRepo.save(booking);

    // Process rentals
    if (createDto.rentals?.length > 0) {
      // Get all equipment IDs
      const equipmentIds = createDto.rentals.map((r) => r.equipmentId);

      // Fetch equipment prices in single query
      const equipments = await this.inventoryRepository.findByIds(equipmentIds);
      const priceMap = new Map(
        equipments.map((eq) => [eq.id, eq.rental_price_per_hour]),
      );

      const rentals = createDto.rentals.map((rental) => {
        const price = priceMap.get(rental.equipmentId);
        if (price === undefined) {
          throw new Error(`Equipment with ID ${rental.equipmentId} not found`);
        }

        return this.rentalRepo.create({
          sizeValue: rental.sizeValue,
          sizeId: rental.sizeId,
          quantity: rental.quantity,
          equipmentId: rental.equipmentId,
          name: rental.equipmentName,
          price: price, // ✅ From database
          booking: { id: savedBooking.id },
          status: 'STAGED', // ✅ Added status
        });
      });

      await this.rentalRepo.save(rentals);
    }

    return savedBooking;
  }

  async confirmBooking(bookingId: string) {
    // 1. Load booking with rentals
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['rentals'],
    });

    console.log('Booking to confirm:', booking);

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    // 2. Validate booking status
    if (booking.status !== 'STAGED') {
      throw new BadRequestException(`Booking already ${booking.status}`);
    }

    // 3. Fetch related activity to get max capacity
    const activity = await this.activityRepository.findOne({
      where: { id: booking.activityId },
      relations: ['customer'],
    });

    if (!activity) {
      throw new BadRequestException(
        `Activity with ID ${booking.activityId} not found`,
      );
    }

    const activityId = booking.activityId;
    const customerId = booking.customerId;
    const slotDate = booking.bookingDate;
    const slotTime =
      booking.bookingTime.length === 5
        ? `${booking.bookingTime}:00`
        : booking.bookingTime;
    const requestedTickets = booking.numberOfTickets;

    // 4. Try to fetch an existing activity log for that slot
    let slotLog = await this.bookingActivityLogs.findOne({
      where: {
        activity_id: activityId,
        customer_id: customerId,
        slot_date: slotDate,
        slot_time: slotTime,
      },
    });

    if (!slotLog) {
      // No slot exists → create a new one if within capacity
      if (requestedTickets > activity.max_per_slot) {
        throw new BadRequestException(
          `Not enough capacity. Requested ${requestedTickets}, but only ${activity.max_per_slot} available`,
        );
      }

      slotLog = this.bookingActivityLogs.create({
        activity_id: activityId,
        customer_id: customerId,
        slot_date: slotDate,
        slot_time: slotTime,
        max_capacity: activity.max_per_slot,
        booked_count: requestedTickets,
      });

      await this.bookingActivityLogs.save(slotLog);
    } else {
      // Slot already exists → increment if it doesn’t exceed capacity
      const newTotal = slotLog.booked_count + requestedTickets;
      if (newTotal > slotLog.max_capacity) {
        throw new BadRequestException(
          `Slot overbooked. Total would be ${newTotal}, but capacity is ${slotLog.max_capacity}`,
        );
      }

      slotLog.booked_count = newTotal;
      await this.bookingActivityLogs.save(slotLog);
    }

    // 5. Create or update activity rental reservations
    if (booking.rentals?.length > 0) {
      if (!activity.duration_hours) {
        throw new BadRequestException('Activity duration not configured');
      }

      console.log('Rentals to process:', booking.rentals);

      for (const rental of booking.rentals) {
        // Calculate rental time window
        const [hours, minutes] = booking.bookingTime.split(':').map(Number);
        const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        const endHours = hours + activity.duration_hours;
        const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        // Format date consistently
        const formattedDate = format(booking.bookingDate, 'yyyy-MM-dd');
        console.log('Formatted date:', formattedDate, booking.bookingDate);
        // Get available quantity for this equipment size
        const inventorySize = await this.inventorySizeRepo.findOne({
          where: {
            inventory: { id: rental.equipmentId },
            id: Number(rental.sizeId),
          },
          relations: ['inventory'],
        });

        if (!inventorySize) {
          throw new BadRequestException(
            `Size ${rental.sizeValue} for ${rental.name} not available`,
          );
        }

        // Find all reservations for this equipment/size/date
        const allReservations = await this.activityRentalReservationRepo.find({
          where: {
            inventory_id: rental.equipmentId,
            size_id: rental.sizeId as any,
            slot_date: booking.bookingDate,
          },
        });

        console.log('All reservations for this rental:', allReservations);

        // Filter overlapping reservations
        const overlappingReservations = allReservations.filter(
          (reservation) => {
            return (
              reservation.start_time <= endTime &&
              reservation.end_time >= startTime
            );
          },
        );

        // Calculate total reserved quantity
        const totalReserved = overlappingReservations.reduce(
          (sum, res) => sum + res.rental_booked_count,
          0,
        );

        // Check availability
        const availableQuantity = inventorySize.quantity;
        if (totalReserved + rental.quantity > availableQuantity) {
          throw new BadRequestException(
            `Insufficient ${rental.name} (size ${rental.sizeValue}). ` +
              `Requested: ${rental.quantity}, Available: ${availableQuantity - totalReserved}`,
          );
        }

        // Create new reservation
        const reservation = new ActivityRentalReservation();
        reservation.activity_id = booking.activityId;
        reservation.customer_id = booking.customerId;
        reservation.slot_date = booking.bookingDate;
        reservation.start_time = startTime;
        reservation.end_time = endTime;
        reservation.inventory_id = rental.equipmentId;
        reservation.size_id = Number(rental.sizeId);
        reservation.rental_booked_count = rental.quantity;
        reservation.status = 'CONFIRMED';
        reservation.max_capacity = availableQuantity;

        await this.activityRentalReservationRepo.save(reservation);
      }
    }

    // 6. Confirm the booking
    booking.status = 'CONFIRMED';
    booking.paymentStatus = true;
    await this.bookingRepo.save(booking);

    return {
      bookingId: booking.id,
      status: 'CONFIRMED',
      paymentStatus: true,
      slot: {
        activityId,
        customerId,
        slotDate,
        slotTime,
        bookedCount: slotLog.booked_count,
        maxCapacity: slotLog.max_capacity,
      },
    };
  }

  async returnSlotAvailabilityByDate(date: string, activityId: number) {
    console.log('Checking availability for:', date, activityId);

    // 1. Fetch activity details
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
      relations: ['schedules'],
    });

    if (!activity) throw new Error('Activity not found');

    const slotInterval = activity.slot_interval_minutes;
    const maxPerSlot = activity.max_per_slot;

    // 2. Find applicable schedule for that day (e.g., Monday)
    const dayOfWeek = dayjs(date).format('dddd').toLowerCase(); // e.g. 'monday'
    const schedule = activity.schedules.find(
      (s) => s.day.toLowerCase() === dayOfWeek,
    );

    console.log('Schedule for the day:', schedule);

    if (!schedule || schedule.is_holiday) {
      return { activityId, date, slots: [] };
    }

    // Handle 24-hour schedules (start/end times may be null)
    let startTime: dayjs.Dayjs;
    let endTime: dayjs.Dayjs;
    if (schedule.is_24hours) {
      startTime = dayjs(date).startOf('day');
      endTime = dayjs(date).endOf('day');
    } else {
      if (!schedule.start_time || !schedule.end_time) {
        return { activityId, date, slots: [] };
      }
      startTime = dayjs(`${date} ${schedule.start_time}`);
      endTime = dayjs(`${date} ${schedule.end_time}`);
    }

    // 3. Generate time slots
    const generatedSlots: string[] = [];
    let current = startTime;

    while (current.isBefore(endTime) || current.isSame(endTime)) {
      generatedSlots.push(current.format('HH:mm:ss')); // format for DB compatibility
      current = current.add(slotInterval, 'minute');
    }

    // 4. Fetch actual booked slots
    const existingBookings = await this.bookingActivityLogs.find({
      where: {
        activity_id: activityId,
        slot_date: date,
      },
      select: ['slot_time', 'booked_count'],
    });

    const bookingMap = new Map(
      existingBookings.map((b) => [b.slot_time, b.booked_count]),
    );

    // 5. Combine both
    const formattedSlots = generatedSlots.map((slotTime) => {
      const bookedCount = bookingMap.get(slotTime) || 0;
      const availableTickets = Math.max(0, maxPerSlot - bookedCount);
      return {
        slotTime,
        availableTickets,
      };
    });

    return {
      activityId,
      date,
      slots: formattedSlots,
    };
  }

  async getBookingDetailByID(bookingId: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['rentals'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    const activityBasePrice = parseFloat(booking.activity_base_price || '0');
    const ticketCount = booking.numberOfTickets || 0;
    const activityCost = activityBasePrice * ticketCount;

    let rentalsTotal = 0;
    const rentalItems = (booking.rentals || []).map((rental) => {
      const price = parseFloat(rental.price.toString() || '0');
      const itemTotal = price * rental.quantity;
      rentalsTotal += itemTotal;

      return {
        ...rental,
        itemTotal,
      };
    });

    const subtotal = activityCost + rentalsTotal;
    const tax = parseFloat((subtotal * 0.13).toFixed(2)); // 13% HST
    const total = parseFloat((subtotal + tax).toFixed(2));

    return {
      ...booking,
      costBreakdown: {
        activityCost,
        rentalsTotal,
        rentalItems,
        subtotal,
        tax,
        total,
      },
    };
  }
}
