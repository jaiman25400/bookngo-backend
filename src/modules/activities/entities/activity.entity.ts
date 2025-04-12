// src/activities/activity.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Customer } from '../../customers/entities/customers.entity';
import { ActivityZone } from '../../activity-zones/entities/activity-zone.entity';
import { ActivitySchedule } from './activity-schedule.entity';
import { ActivityHoliday } from './activity-holiday.entity';
import { BookingType, AgeGroup } from '../enums/activity-type.enum';
import { Exclude } from 'class-transformer';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Customer, (customer) => customer.id, { onDelete: 'CASCADE' })
  customer: Customer;

  // ✅ Many-to-Many relationship with Zones
  @ManyToMany(() => ActivityZone, { cascade: true })
  @JoinTable({
    name: 'activity_zone_mapping',
    joinColumn: { name: 'activity_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'zone_id', referencedColumnName: 'id' },
  })
  zones: ActivityZone[];

  @OneToMany(() => ActivitySchedule, (schedule) => schedule.activity, {
    cascade: true,
    onDelete: 'CASCADE', // Database-level cascade
  })
  @Exclude({ toPlainOnly: true }) // Add this
  schedules: ActivitySchedule[];

  @OneToMany(() => ActivityHoliday, (holiday) => holiday.activity, {
    cascade: true,
    onDelete: 'CASCADE', // Ensures holidays are deleted if activity is deleted
    orphanedRowAction: 'delete' // Automatically removes orphaned holidays
  })
  holidays: ActivityHoliday[];

  @Column()
  activity_name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  base_price: number; // ✅ Activity price

  @Column({ type: 'int' })
  duration_hours: number;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column({ type: 'enum', enum: AgeGroup, nullable: true })
  age_group: AgeGroup | null;

  @Column({ nullable: true, length: 255 })
  activity_tagline: string;

  @Column({ type: 'text' })
  activity_description: string;

  @Column({ nullable: true })
  activity_thumbnail_image: string;

  @Column('text', { array: true, nullable: true })
  activity_image_gallery: string[];

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'text', nullable: true })
  safety_instructions: string;

  @Column({ type: 'boolean', default: false })
  requires_waiver: boolean;

  @Column({
    type: 'enum',
    enum: BookingType,
    default: BookingType.ANYTIME,
  })
  booking_type: BookingType;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
