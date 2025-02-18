import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  customer_name: string;  // Business name (e.g., "Boler Mountain")

  @Column('enum', { enum: ['Winter', 'Summer', 'Events'], array: true, default: '{}' })
  business_type: string[];

  @Column({ default: true })
  is_active: boolean;  // If the business is active

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
