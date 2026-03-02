import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { InventorySize } from './entities/inventory-size.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { CreateInventorySizeDto } from './dto/create-inventory-size.dto';
import { Customer } from '../customers/entities/customers.entity';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { deleteFileIfExists } from 'src/utils/common.helper';

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

  async createInventory(
    customer: Customer,
    createInventoryDto: CreateInventoryDto,
    thumbnail: Express.Multer.File | undefined,
  ) {
    const {
      equipment_name,
      totalQuantity,
      availableQuantity,
      rental_price_per_hour,
      description,
      sizes,
    } = createInventoryDto;

    // Generate thumbnail URL if file exists
    const thumbnailImageUrl = thumbnail
      ? `/uploads/CMS/inventory/${thumbnail.filename}`
      : null;

    // Create inventory entry including new optional fields
    const newInventory = this.inventoryRepository.create({
      customer: customer, // Must be a full Customer entity
      equipment_name,
      totalQuantity,
      availableQuantity,
      rental_price_per_hour: Number(rental_price_per_hour), // Ensure correct type
      description,
      thumbnailImageUrl: thumbnailImageUrl || null, // Explicit null
    });

    const savedInventory = await this.inventoryRepository.save(newInventory);

    // Add sizes if provided, including the optional description field for each size
    // Handle sizes parsing and saving
    if (sizes) {
      const parsedSizes = sizes;
      if (parsedSizes.length > 0) {
        const inventorySizes = parsedSizes.map((size) => ({
          inventory: savedInventory,
          ...size,
        }));
        await this.inventorySizeRepository.save(inventorySizes);
      }
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

  async updateInventory(
    id: number,
    updateInventoryDto: UpdateInventoryDto,
    thumbnail?: Express.Multer.File,
  ) {
    try {
      // Step 1: Get the existing inventory by ID
      const inventory = await this.getInventoryById(id);
      if (!inventory) {
        throw new NotFoundException(`Inventory with ID ${id} not found`);
      }
      // Handle file update
      if (thumbnail) {
        await deleteFileIfExists(inventory.thumbnailImageUrl);
        // Update with new file path
        inventory.thumbnailImageUrl = `/uploads/CMS/inventory/${thumbnail.filename}`;
      }

      // Step 2: Update the main inventory fields
      // Update main inventory fields
      Object.assign(inventory, updateInventoryDto);
      const updatedSizes = updateInventoryDto.sizes || [];

      // 1. Delete sizes not present in the update
      const sizesToKeep = updatedSizes.map((s) => s.size);
      await this.inventorySizeRepository
        .createQueryBuilder()
        .delete()
        .where('inventory_id = :id AND size NOT IN (:...sizes)', {
          id,
          sizes: sizesToKeep.length > 0 ? sizesToKeep : [''],
        })
        .execute();

      // 2. Upsert remaining sizes using proper relation format
      if (updatedSizes.length > 0) {
        const sizesToUpsert = updatedSizes.map((s) => ({
          inventory: { id }, // Use relation format
          size: s.size,
          quantity: s.quantity,
          description: s.description,
        }));

        await this.inventorySizeRepository.upsert(sizesToUpsert, {
          conflictPaths: ['inventory.id', 'size'], // Use relation path
          skipUpdateIfNoValuesChanged: true,
        });
      }

      // Refresh sizes relationship
      inventory.sizes = await this.inventorySizeRepository.find({
        where: { inventory: { id } },
      });

      await this.inventoryRepository.save(inventory);
      return inventory;
    } catch (error) {
      // Clean up uploaded file if error occurs
      if (thumbnail) {
        const newFilePath = join(
          process.cwd(),
          'uploads',
          'CMS',
          thumbnail.filename,
        );
        if (existsSync(newFilePath)) {
          unlinkSync(newFilePath);
        }
      }
      throw error;
    }
  }

  async deleteInventory(id: number, customer_id: number) {
    const inventory = await this.inventoryRepository.findOne({
      where: { id, customer: { id: customer_id } },
      relations: ['customer'],
    });

    if (!inventory) {
      throw new NotFoundException(
        `Inventory not found or does not belong to the customer.`,
      );
    }

    // Delete associated thumbnail file
    if (inventory.thumbnailImageUrl) {
      await deleteFileIfExists(inventory.thumbnailImageUrl);
    }

    // Delete database record
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
