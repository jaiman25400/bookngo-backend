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
import { Customer } from '../../customers/customers.entity';
import { ActivityZone } from '../../activity-zones/entities/activity-zone.entity';
import { ActivitySchedule } from './activity-schedule.entity';
import { ActivityHoliday } from './activity-holiday.entity';

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
    onDelete: 'CASCADE' // Database-level cascade
  })
  schedules: ActivitySchedule[];

  @OneToMany(() => ActivityHoliday, (holiday) => holiday.activity, {
    cascade: true,
    onDelete: 'CASCADE', // Ensures holidays are deleted if activity is deleted
  })
  holidays: ActivityHoliday[];

  @Column()
  activity_name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  base_price: number; // ✅ Activity price

  @Column({ type: 'int', nullable: true })
  duration_hours: number;

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
