// activity-zone.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customers.entity';

export enum AgeGroup {
  CHILD = '5+',
  TEEN = '10+',
  ADULT = '18+',
  SENIOR = '50+',
}

export enum ZoneStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CLOSED = 'closed',
}

@Entity('activity_zones')
export class ActivityZone {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: false, default: '' })
  description: string;

  @Column({ type: 'enum', enum: AgeGroup, nullable: true })
  age_group: AgeGroup | null;
  
  @Column({ nullable: true })
  zone_tagline: string;

  @Column({ nullable: true })
  zone_thumbnail_image: string;

  @Column('text', { array: true, nullable: true })
  zone_image_gallery: string[];

  @Column({
    type: 'enum',
    enum: ZoneStatus,
    default: ZoneStatus.ACTIVE,
  })
  status: ZoneStatus;

  // Existing fields
  @Column({ type: 'int', nullable: true })
  capacity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @ManyToOne(() => Customer, (customer) => customer.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer' })
  customer: Customer;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
