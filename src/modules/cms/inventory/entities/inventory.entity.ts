// src/inventory/inventory.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customers.entity';
import { InventorySize } from './inventory-size.entity';

@Entity({ name : 'inventories', schema : 'BookNGo_CMS'})
export class Inventory {
  @PrimaryGeneratedColumn()
  id: number;

  // The inventory belongs to a Customer (e.g., Boler Mountain)
  @ManyToOne(() => Customer, (customer) => customer.id, { onDelete: 'CASCADE' })
  customer: Customer;

  // Equipment type: Ski, Snowboard, Boots, Helmet, etc.
  @Column()
  equipment_name: string;

  // Total quantity owned (e.g., 500 skis)
  @Column({ type: 'int' })
  totalQuantity: number;

  // The number of items available for booking (should be derived from rentalPercentage)
  @Column({ type: 'int' })
  availableQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  rental_price_per_hour: number; // ✅ Rental price per hour

  // Additional descriptive information about the inventory
  @Column({ type: 'text', nullable: true })
  description: string;

  // URL to the inventory's thumbnail image
  @Column({
    type: 'varchar',
    nullable: true,
  })
  thumbnailImageUrl: string | null; // Add union type with null

  // Relation: Inventory can have multiple sizes
  @OneToMany(() => InventorySize, (inventorySize) => inventorySize.inventory, {
    cascade: true,
  })
  sizes: InventorySize[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
