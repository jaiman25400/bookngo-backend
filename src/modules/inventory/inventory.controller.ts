import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventorySizeDto } from './dto/create-inventory-size.dto';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('add')
  async createInventory(@Body() createInventoryDto: CreateInventoryDto) {
    return await this.inventoryService.createInventory(createInventoryDto);
  }

  @Get()
  async getAllInventories(@Query('customer_id') customer_id: number) {
    console.log("Cust :",customer_id)
    return this.inventoryService.getAllInventories(customer_id);
  }

  @Get(':id')
  async getInventoryById(@Param('id') id: number) {
    return this.inventoryService.getInventoryById(id);
  }

  @Put(':id')
  async updateInventory(
    @Param('id') id: number,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    return this.inventoryService.updateInventory(id, updateInventoryDto);
  }

  @Delete(':id')
  async deleteInventory(
    @Param('id') id: number,
    @Query('customer_id') customer_id: number, // ✅ Get customer_id from query params
  ) {
    return this.inventoryService.deleteInventory(id, customer_id);
  }  

  @Post(':id/sizes')
  async addInventorySize(
    @Param('id') inventoryId: number,
    @Body() createSizeDto: CreateInventorySizeDto,
  ) {
    return this.inventoryService.addInventorySize(inventoryId, createSizeDto);
  }
}
