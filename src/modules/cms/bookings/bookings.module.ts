import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking_logs } from '../../user/bookings/entities/booking_logs.entity';
import { Activity } from '../activities/entities/activity.entity';
import { CustomerDetail } from '../customers/entities/customers-detail.entity';
import { BookingsModule } from '../../user/bookings/bookings.module';
import { CmsBookingsController } from './bookings.controller';
import { CmsBookingsService } from './bookings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking_logs, Activity, CustomerDetail]),
    BookingsModule,
  ],
  controllers: [CmsBookingsController],
  providers: [CmsBookingsService],
})
export class CmsBookingsModule {}
