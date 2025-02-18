// src/inventory/inventory-size.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn
  } from 'typeorm';
  import { Inventory } from './inventory.entity';
  
  @Entity('inventory_sizes')
  export class InventorySize {
    @PrimaryGeneratedColumn()
    id: number;
  
    // Link back to the Inventory record
    @ManyToOne(() => Inventory, inventory => inventory.sizes, { onDelete: 'CASCADE' })
    inventory: Inventory;
  
    // Size label (e.g., "Small", "Large" or a numeric value)
    @Column()
    size: string;
  
    // Number of items for this particular size (e.g., 200 small skis)
    @Column({ type: 'int' })
    quantity: number;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  }
  