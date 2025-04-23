import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customers.entity';

@Entity({ name : 'customer_details', schema : 'BookNGo_CMS'})
export class CustomerDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Customer, (customer) => customer.detail, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_id' }) // Explicitly define the foreign key column
  customer: Customer; // ✅ Correct relationship setup

  @Column('text', { nullable: true })
  customer_display_name: string;

  @Column('text', { name: 'home_tagLine', nullable: true })
  home_tagLine: string;

  @Column('text', { nullable: true })
  customer_display_email: string;

  @Column('text', { nullable: true })
  customer_description: string;

  @Column('text', { nullable: true })
  customer_address: string;

  @Column('text', { nullable: true })
  customer_city: string;

  @Column('text', { nullable: true })
  customer_state: string;

  @Column('text', { nullable: true })
  customer_zip: string;

  @Column('text', { nullable: true })
  home_image_url: string; // Home page image URL

  @Column('text', { array: true, nullable: true })
  home_image_gallery: string[];

  @Column('text', { nullable: true })
  about_us: string; // Extended customer bio
  
  @Column('text', { nullable: true })
  features: string; // Any additional features or special offers
}
