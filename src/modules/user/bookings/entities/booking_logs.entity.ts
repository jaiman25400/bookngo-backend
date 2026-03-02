// src/user/booking-confirmations/entities/booking-confirmation.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BookingRentalLogs } from './booking_rentals_logs.entity';

@Entity({ name: 'booking_logs', schema: 'BookNGo_Users' })
export class Booking_logs {
  @PrimaryGeneratedColumn('uuid') // Single decorator
  id: string;

  // Customer Info (store as plain values)
  @Column()
  customerId: string; // Reference ID (string)

  @Column()
  user_name: string;

  @Column()
  user_email: string;

  @Column()
  user_phone: string;

  @Column()
  activity_base_price: string;

  // Activity Info (store as plain values)
  @Column()
  activityId: number; // Reference ID (number)

  @Column()
  vendorSlug: string;

  @Column()
  zoneId: number;

  @Column()
  zoneName: string;

  // Booking Details
  @Column({ type: 'date' })
  bookingDate: string;

  @Column({ type: 'time' })
  bookingTime: string;

  @Column({ name: 'number_of_tickets' })
  numberOfTickets: number;

  // Rental relationship
  @OneToMany(() => BookingRentalLogs, (rental) => rental.booking, {
    cascade: true,
    eager: true, // Optional: load rentals with booking
  })
  rentals: BookingRentalLogs[];

  // Status
  @Column({
    type: 'enum',
    enum: ['STAGED', 'CONFIRMED', 'CHECKED_IN', 'CANCELLED', 'COMPLETED'],
    default: 'STAGED',
  })
  status: 'STAGED' | 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED' | 'COMPLETED';

  @Column({ default: false })
  waiverSigned: boolean;

  @Column({ type: 'timestamp', nullable: true })
  waiverSignedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  checkedInAt: Date | null;

  @Column({ type: 'int', nullable: true })
  checkedInBy: number | null;

  @Column({ default: false })
  paymentStatus: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
