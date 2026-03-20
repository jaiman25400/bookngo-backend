import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventorySizeDto } from './dto/create-inventory-size.dto';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from '../../storage/uploads.service';
import { multerMemoryOptions } from '../../../utils/multer-memory';

const INVENTORY_UPLOAD_FOLDER = 'CMS/inventory';

@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly uploads: UploadsService,
  ) {}

  @Post('add')
  @UseInterceptors(FileInterceptor('thumbnail', multerMemoryOptions))
  async createInventory(
    @Request() req,
    @Body() createInventoryDto: CreateInventoryDto,
    @UploadedFile() thumbnail?: Express.Multer.File,
  ) {
    const thumbRef = thumbnail
      ? await this.uploads.persistMulterFile(thumbnail, INVENTORY_UPLOAD_FOLDER)
      : undefined;
    return await this.inventoryService.createInventory(
      req.user.customer,
      createInventoryDto,
      thumbRef,
    );
  }

  @Get()
  async getAllInventories(@Request() req) {
    return this.inventoryService.getAllInventories(req.user?.customer);
  }

  @Get(':id')
  async getInventoryById(@Param('id') id: number) {
    return this.inventoryService.getInventoryById(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('thumbnail', multerMemoryOptions))
  async updateInventory(
    @Param('id') id: number,
    @Body() updateInventoryDto: UpdateInventoryDto,
    @UploadedFile() thumbnail?: Express.Multer.File,
  ) {
    const thumbRef = thumbnail
      ? await this.uploads.persistMulterFile(thumbnail, INVENTORY_UPLOAD_FOLDER)
      : undefined;
    return this.inventoryService.updateInventory(
      id,
      updateInventoryDto,
      thumbRef,
    );
  }

  @Delete(':id')
  async deleteInventory(@Param('id') id: number, @Request() req) {
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
