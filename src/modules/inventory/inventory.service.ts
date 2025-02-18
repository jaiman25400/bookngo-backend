import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { InventorySize } from './entities/inventory-size.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { CreateInventorySizeDto } from './dto/create-inventory-size.dto';
import { Customer } from '../customers/customers.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,

    @InjectRepository(InventorySize)
    private inventorySizeRepository: Repository<InventorySize>,

    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async createInventory(createInventoryDto: CreateInventoryDto) {
    const {
      customer_id,
      equipment_name,
      totalQuantity,
      availableQuantity,
      sizes,
    } = createInventoryDto;

    // Find customer (to link inventory)
    const customer = await this.customerRepository.findOne({
      where: { id: customer_id },
    });
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Create inventory entry
    const newInventory = this.inventoryRepository.create({
      customer,
      equipment_name,
      totalQuantity,
      availableQuantity,
    });

    const savedInventory = await this.inventoryRepository.save(newInventory);

    // Add sizes if provided
    if (sizes && sizes.length > 0) {
      const inventorySizes = sizes.map((size) => ({
        inventory: savedInventory,
        size: size.size,
        quantity: size.quantity,
      }));
      await this.inventorySizeRepository.save(inventorySizes);
    }

    return savedInventory;
  }

  async getAllInventories(customer_id: number) {
    return await this.inventoryRepository.find({
      where: { customer: { id: customer_id } },
      relations: ['sizes'],
    });
  }

  async getInventoryById(id: number) {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['sizes'],
    });
    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }
    return inventory;
  }

  async updateInventory(id: number, updateInventoryDto: UpdateInventoryDto) {

    // Step 1: Get the existing inventory by ID
    const inventory = await this.getInventoryById(id);
    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    // Step 2: Update the main inventory fields
    Object.assign(inventory, updateInventoryDto);

    // Step 3: Get updated sizes from DTO
    const updatedSizes = updateInventoryDto.sizes || [];

    // Step 4: Get existing sizes from the database
    const existingSizes = await this.inventorySizeRepository.find({
      where: { inventory: { id } },
    });

    // Step 5: Delete sizes that are no longer in the updated list
    const sizesToDelete = existingSizes.filter(
      (existingSize) =>
        !updatedSizes.some(
          (updatedSize) => updatedSize.size === existingSize.size,
        ),
    );
    if (sizesToDelete.length > 0) {
      await this.inventorySizeRepository.remove(sizesToDelete);
    }

    // Step 6: Update or create new sizes
    for (const updatedSize of updatedSizes) {
      const existingSize = existingSizes.find(
        (size) => size.size === updatedSize.size,
      );
      if (existingSize) {
        // Update existing size
        existingSize.quantity = updatedSize.quantity;
        await this.inventorySizeRepository.save(existingSize);
      } else {
        // Create new size (for new sizes, 'id' is not provided)
        const newSize = this.inventorySizeRepository.create({
          inventory, // Ensure association with the inventory
          size: updatedSize.size,
          quantity: updatedSize.quantity,
        });
        // Explicitly set the inventory foreign key
        if (!newSize.inventory) {
          newSize.inventory = inventory;
        }
        await this.inventorySizeRepository.save(newSize);
      }
    }

    // Step 7: Refresh the inventory's sizes from the database to sync state
    inventory.sizes = await this.inventorySizeRepository.find({
      where: { inventory: { id } },
    });

    // Step 8: Save the updated inventory object
    await this.inventoryRepository.save(inventory);

    return inventory;
  }

  async deleteInventory(id: number, customer_id: number) {
    const inventory = await this.inventoryRepository.findOne({
      where: { id, customer: { id: customer_id } }, // ✅ Ensure inventory belongs to customer
      relations: ['customer'],
    });
  
    if (!inventory) {
      throw new NotFoundException(`Inventory not found or does not belong to the customer.`);
    }
  
    return await this.inventoryRepository.remove(inventory);
  }
  

  async addInventorySize(
    inventoryId: number,
    createSizeDto: CreateInventorySizeDto,
  ) {
    const inventory = await this.getInventoryById(inventoryId);
    const newSize = this.inventorySizeRepository.create({
      ...createSizeDto,
      inventory,
    });
    return await this.inventorySizeRepository.save(newSize);
  }
}
