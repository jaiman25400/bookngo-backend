import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from './customers.entity';

@Entity('customer_users')
export class CustomerUser {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Customer, (customer) => customer.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;  // Links to the business (customer)

  @Column({ unique: true })
  email: string;  // User login email

  @Column()
  password: string;  // Hashed password

  @Column('enum', { enum: ['client-manager', 'client-staff'], default: 'client-staff' })
  role: string;  // Defines user roles in the business

  @Column({ default: true })
  is_active: boolean;  // If the user is active

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
