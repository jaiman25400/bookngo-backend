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

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Customer, (customer) => customer.id, { onDelete: 'CASCADE' })
  customer: Customer;

  @Column()
  activity_name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  base_price: number; // ✅ Activity price

  @Column({ type: 'int', nullable: true })
  duration_hours: number;

  @Column({ type: 'time', nullable: true })
  start_time: string;

  @Column({ type: 'time', nullable: true })
  end_time: string;

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
