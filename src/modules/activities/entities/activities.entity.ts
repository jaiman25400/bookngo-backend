// src/activities/activity.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Customer } from '../../customers/customers.entity';
import { ActivityInventory } from './activities-inventory.entity';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Customer, (customer) => customer.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column()
  activity_name: string; // e.g., "Ski Day Pass", "Ski 3-Hour Pass", "Season Pass"

  @Column('text', { nullable: true })
  activity_description: string;

  @Column({ default: false }) 
  requires_rental: boolean; // If true, user can select rentals

  @OneToMany(
    () => ActivityInventory,
    (activityInventory) => activityInventory.activity,
    { cascade: true },
  )
  activityInventories: ActivityInventory[];

  @Column({ type: 'int', nullable: true })
  duration_hours: number; // e.g., 3 for a 3-hour pass

  @Column({ type: 'time', nullable: true })
  start_time: string; // e.g., "08:00:00"

  @Column({ type: 'time', nullable: true })
  end_time: string; // e.g., "21:30:00"

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
