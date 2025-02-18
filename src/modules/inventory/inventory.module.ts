import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './entities/inventory.entity';
import { InventorySize } from './entities/inventory-size.entity';
import { Customer } from '../customers/customers.entity';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Inventory, InventorySize, Customer])],  // ✅ Fix: Import TypeOrmModule with entities
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [TypeOrmModule]  // ✅ If another module needs these repositories
})
export class InventoryModule {}
