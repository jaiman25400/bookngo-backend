// src/inventory/inventory.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn
  } from 'typeorm';
  import { Customer } from '../../customers/customers.entity';
  import { InventorySize } from './inventory-size.entity';
  import { ActivityInventory } from '../../activities/entities/activities-inventory.entity';
  
  @Entity('inventories')
  export class Inventory {
    @PrimaryGeneratedColumn()
    id: number;
  
    // The inventory belongs to a Customer (e.g., Boler Mountain)
    @ManyToOne(() => Customer, customer => customer.id, { onDelete: 'CASCADE' })
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
  
    // Relation: Inventory can have multiple sizes
    @OneToMany(() => InventorySize, inventorySize => inventorySize.inventory, { cascade: true })
    sizes: InventorySize[];
  
    // Relation: This inventory might be used in one or more activities
    @OneToMany(() => ActivityInventory, activityInventory => activityInventory.inventory)
    activityInventories: ActivityInventory[];
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  }
  