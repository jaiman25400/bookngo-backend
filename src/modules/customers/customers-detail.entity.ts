import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Customer } from '../customers/customers.entity';

@Entity('customer_details')
export class CustomerDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Customer, (customer) => customer.id)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;  // Foreign key to customers table

  @Column('text', { nullable: true })
  img_url: string;  // Profile image URL

  @Column('text', { nullable: true })
  home_img_url: string;  // Home page image URL

  @Column('text', { nullable: true })
  about_us: string;  // Extended customer bio

  @Column('json', { nullable: true })
  working_hours: {
    weekdays: { start: string, end: string };  // Regular weekday hours
    weekends: { start: string, end: string };  // Weekend hours
    holidays?: { [key: string]: { start: string, end: string } };  // Optional holidays (key = holiday name)
  };

  @Column('text', { nullable: true })
  features: string;  // Any additional features or special offers
}
