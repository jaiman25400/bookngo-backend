import { Controller, Get, Post, Put, Delete, Param, Body, Query, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventorySizeDto } from './dto/create-inventory-size.dto';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('add')
  async createInventory(@Request() req, @Body() createInventoryDto: CreateInventoryDto) {
    console.log("Add INV :",createInventoryDto)
    return await this.inventoryService.createInventory(req.user.customer,createInventoryDto);
  }

  @Get()
  async getAllInventories(@Request() req) {
    return this.inventoryService.getAllInventories(req.user.customer);
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
    console.log('Update Inv',updateInventoryDto)
    return this.inventoryService.updateInventory(id, updateInventoryDto);
  }

  @Delete(':id')
  async deleteInventory(
    @Param('id') id: number,
    @Request() req
  ) {
    return this.inventoryService.deleteInventory(id, req.user?.customer);
  }  

  @Post(':id/sizes')
  async addInventorySize(
    @Param('id') inventoryId: number,
    @Body() createSizeDto: CreateInventorySizeDto,
  ) {
    return this.inventoryService.addInventorySize(inventoryId, createSizeDto);
  }
}
