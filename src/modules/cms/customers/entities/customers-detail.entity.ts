import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Customer } from './customers.entity';

@Entity({ name: 'customer_details', schema: 'BookNGo_CMS' })
@Unique(['customer_slug', 'customer_display_name']) // Composite unique constraint
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

  @Column('double precision', { nullable: true })
  customer_latitude: number;

  @Column('double precision', { nullable: true })
  customer_longitude: number;

  @Column('text', { nullable: true })
  customer_display_email: string;

  @Column('text', { nullable: true })
  customer_slug: string;

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
