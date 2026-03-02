// bookings.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Inventory } from '@/modules/cms/inventory/entities/inventory.entity';
import { CustomerDetail } from '@/modules/cms/customers/entities/customers-detail.entity';
import { Booking_logs } from './entities/booking_logs.entity';
import { BookingRentalLogs } from './entities/booking_rentals_logs.entity';
import { Activity } from '@/modules/cms/activities/entities/activity.entity';
import { BookingActivityLogs } from './entities/booking_activity_logs.entity';
import { ActivityRentalReservation } from './entities/booking_activity_rentals_logs.entity';
import { InventorySize } from '@/modules/cms/inventory/entities/inventory-size.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inventory,
      CustomerDetail,
      Activity,
      Booking_logs,
      BookingRentalLogs,
      BookingActivityLogs,
      ActivityRentalReservation,
      InventorySize,
    ]),
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
