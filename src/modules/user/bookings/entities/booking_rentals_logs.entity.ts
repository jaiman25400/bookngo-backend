// src/user/booking-confirmations/entities/booking_rentals_logs.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Booking_logs } from './booking_logs.entity';

@Entity({ name: 'booking_rentals_logs', schema: 'BookNGo_Users' })
export class BookingRentalLogs {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Booking_logs, (booking) => booking.rentals, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking_logs;

  @Column()
  equipmentId: number;

  @Column()
  name: string;

  @Column()
  sizeValue: string;

  @Column()
  sizeId: string;

  @Column()
  status: string;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: false })
  returned: boolean;

  @Column({ nullable: true })
  returnedAt: Date;
}
