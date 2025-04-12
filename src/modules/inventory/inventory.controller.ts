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
import { diskStorage } from 'multer';
import { join } from 'path';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('add')
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'inventory'), // Absolute path
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  async createInventory(
    @Request() req,
    @Body() createInventoryDto: CreateInventoryDto,
    @UploadedFile() thumbnail?: Express.Multer.File,
  ) {
    return await this.inventoryService.createInventory(
      req.user.customer, // Make sure this is the Customer entity
      createInventoryDto,
      thumbnail,
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
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'inventory'),
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
          cb(null, uniqueName);
        },
      }),
    })
  )
  async updateInventory(
    @Param('id') id: number,
    @Body() updateInventoryDto: UpdateInventoryDto,
    @UploadedFile() thumbnail?: Express.Multer.File,
  ) {
    return this.inventoryService.updateInventory(id, updateInventoryDto, thumbnail);
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
