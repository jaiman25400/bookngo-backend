// src/activities/activity-inventory.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Activity } from './activities.entity';
import { Inventory } from '../../inventory/entities/inventory.entity';

@Entity('activity_inventories')
export class ActivityInventory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Activity, (activity) => activity.activityInventories, {
    onDelete: 'CASCADE',
  })
  activity: Activity;

  @ManyToOne(() => Inventory, (inventory) => inventory.activityInventories, {
    onDelete: 'CASCADE',
  })
  inventory: Inventory;

  @Column({ type: 'int' })
  quantityRequired: number; // e.g., 1 ski, 1 boot per booking

  @Column({ default: false })
  is_default_rental: boolean; // Automatically assign these if rentals are selected

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
