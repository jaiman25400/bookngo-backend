import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CreateInventorySizeDto } from './create-inventory-size.dto';
import { BadRequestException } from '@nestjs/common';

export class CreateInventoryDto {
  @IsNotEmpty()
  @IsString()
  equipment_name: string;

  @IsNotEmpty()
  @Type(() => Number) // Automatically converts string to number
  totalQuantity: number;

  @IsNotEmpty()
  @Type(() => Number) // Automatically converts string to number
  availableQuantity: number;

  @IsNotEmpty()
  @Type(() => Number) // Automatically converts string to number
  rental_price_per_hour: number;

  // Optional field for additional descriptive information about the inventory
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    try {
      return JSON.parse(value);
    } catch (e) {
      throw new BadRequestException('Invalid JSON format for schedules');
    }
  })
  sizes: CreateInventorySizeDto[];
}
