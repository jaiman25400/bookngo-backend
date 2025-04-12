// src/inventory/inventory-size.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  JoinColumn,
} from 'typeorm';
import { Inventory } from './inventory.entity';

@Entity('inventory_sizes')
@Unique(['inventory', 'size']) // Add unique constraint
export class InventorySize {
  @PrimaryGeneratedColumn()
  id: number;

  // Link back to the Inventory record
  @ManyToOne(() => Inventory, (inventory) => inventory.sizes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'inventory_id' }) // Explicit column name mapping
  inventory: Inventory;

  // Size label (e.g., "Small", "Large" or a numeric value)
  @Column()
  size: string;

  // Additional descriptive details about this size option
  @Column({ type: 'text', nullable: true })
  description: string;

  // Number of items for this particular size (e.g., 200 small skis)
  @Column({ type: 'int' })
  quantity: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
