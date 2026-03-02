import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Index(['activity_id', 'slot_date', 'slot_time'], { unique: true })
@Entity({ name: 'booking_activity_logs', schema: 'BookNGo_Users' })
export class BookingActivityLogs {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  activity_id: number; // FK to activities table

  @Column()
  customer_id: string; // FK to customer

  @Column({ type: 'date' })
  slot_date: string; // The date of the slot (e.g. 2025-06-28)

  @Column({ type: 'time' })
  slot_time: string; // The start time of the slot (e.g. 10:00:00)

  @Column({ type: 'int' })
  max_capacity: number; // Usually copied from activity.max_per_slot

  @Column({ type: 'int', default: 0 })
  booked_count: number; // Incremented as bookings are made

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
