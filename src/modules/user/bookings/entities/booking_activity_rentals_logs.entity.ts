import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'activity_rental_reservations', schema: 'BookNGo_Users' })
export class ActivityRentalReservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Activity Context
  @Column({ type: 'int' })
  activity_id: number; // References Activity.id

  @Column({ type: 'varchar' })
  customer_id: string; // Matches Booking_logs.customerId

  // Time Window
  @Column({ type: 'date' })
  slot_date: string;

  @Column({ type: 'time' })
  start_time: string; // Exact rental start timestamp

  @Column({ type: 'int' })
  max_capacity: number; // Usually copied from activity.max_per_slot

  @Column({ type: 'int' })
  rental_booked_count: number; // Incremented as bookings are made

  @Column({ type: 'time' })
  end_time: string; // Calculated: start_time + activity duration

  // Inventory Tracking
  @Column({ type: 'int' })
  inventory_id: number; // References Inventory.id

  @Column({ type: 'int' })
  size_id: number; // References InventorySize.id

  // Reservation State
  @Column({
    type: 'enum',
    enum: ['PENDING', 'CONFIRMED', 'RELEASED'],
    default: 'PENDING',
  })
  status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  // Optimistic locking
  @Column({ type: 'int', default: 1 })
  version: number;
}
