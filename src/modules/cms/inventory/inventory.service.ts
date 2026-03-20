import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { InventorySize } from './entities/inventory-size.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { CreateInventorySizeDto } from './dto/create-inventory-size.dto';
import { Customer } from '../customers/entities/customers.entity';
import { UploadsService } from '../../storage/uploads.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,

    @InjectRepository(InventorySize)
    private inventorySizeRepository: Repository<InventorySize>,

    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly uploads: UploadsService,
  ) {}

  async createInventory(
    customer: Customer,
    createInventoryDto: CreateInventoryDto,
    thumbnailStorageRef: string | null | undefined,
  ) {
    const {
      equipment_name,
      totalQuantity,
      availableQuantity,
      rental_price_per_hour,
      description,
      sizes,
    } = createInventoryDto;

    const thumbnailImageUrl = thumbnailStorageRef ?? null;

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

    const withUrl = {
      ...savedInventory,
      thumbnailImageUrl: await this.uploads.resolveDisplayUrl(
        savedInventory.thumbnailImageUrl,
      ),
    };

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
    const rows = await this.inventoryRepository.find({
      where: { customer: { id: customer_id } },
      relations: ['sizes'],
    });
    return Promise.all(
      rows.map(async (inv) => ({
        ...inv,
        thumbnailImageUrl: await this.uploads.resolveDisplayUrl(
          inv.thumbnailImageUrl,
        ),
      })),
    );
  }

  async getInventoryById(id: number) {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['sizes'],
    });
    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }
    return {
      ...inventory,
      thumbnailImageUrl: await this.uploads.resolveDisplayUrl(
        inventory.thumbnailImageUrl,
      ),
    };
  }

  async updateInventory(
    id: number,
    updateInventoryDto: UpdateInventoryDto,
    thumbnailStorageRef?: string | null,
  ) {
    try {
      const inventory = await this.inventoryRepository.findOne({
        where: { id },
        relations: ['sizes'],
      });
      if (!inventory) {
        throw new NotFoundException(`Inventory with ID ${id} not found`);
      }
      if (thumbnailStorageRef) {
        await this.uploads.deleteStored(inventory.thumbnailImageUrl);
        inventory.thumbnailImageUrl = thumbnailStorageRef;
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
      return {
        ...inventory,
        thumbnailImageUrl: await this.uploads.resolveDisplayUrl(
          inventory.thumbnailImageUrl,
        ),
      };
    } catch (error) {
      if (thumbnailStorageRef) {
        await this.uploads.deleteStored(thumbnailStorageRef);
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

    if (inventory.thumbnailImageUrl) {
      await this.uploads.deleteStored(inventory.thumbnailImageUrl);
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
