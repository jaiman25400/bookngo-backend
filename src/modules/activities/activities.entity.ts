import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Customer } from '../customers/customers.entity';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Customer, (customer) => customer.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;  // Links activity to a business (e.g., Boler Mountain)

  @Column()
  activity_name: string;  // Custom activity name (e.g., "Skiing", "Snowboarding", "Tubing")

  @Column('text', { nullable: true })
  activity_description: string;  // Activity description

  @Column({ type: 'date', nullable: true })
  start_date: Date;  // Activity start date (NULL if ongoing)

  @Column({ type: 'date', nullable: true })
  end_date: Date;  // Activity end date (NULL if ongoing)

  @Column({ default: true })
  is_active: boolean;  // Can be disabled/enabled by the business

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('activity_pricing')
export class ActivityPricing {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Activity, (activity) => activity.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;  // Links pricing to an activity

  @Column()
  duration_label: string;  // Business-defined duration (e.g., "90 minutes", "Half-day", "Weekend Pass")

  @Column('int', { nullable: true })
  duration_value: number;  // Numeric value (e.g., 90, 4, 7)

  @Column({ type: 'enum', enum: ['minutes', 'hours', 'days', 'weeks'], nullable: true })
  duration_unit: string;  // Unit of time (e.g., minutes, hours, days, weeks)

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;  // Price for this duration

  @Column({ default: true })
  is_active: boolean;  // Can be disabled/enabled by the business

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}