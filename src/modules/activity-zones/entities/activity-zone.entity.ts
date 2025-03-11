import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../../customers/customers.entity';

@Entity('activity_zones')
export class ActivityZone {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // Mandatory Zone Name

  @Column({ nullable: false })
  description: string; // Mandatory Zone Description

  @Column({ type: 'int', nullable: true })
  capacity: number; // Max capacity for this zone (optional)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number; // Zone-specific price (optional)

  @Column({ type: 'time', nullable: true })
  start_time: string; // Start time for availability (optional)

  @Column({ type: 'time', nullable: true })
  end_time: string; // End time for availability (optional)

  // Relation: Link each zone to a customer
  @ManyToOne(() => Customer, (customer) => customer.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer' }) // Use 'customer' as the column name for the foreign key
  customer: Customer;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
