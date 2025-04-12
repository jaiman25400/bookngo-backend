import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CreateInventorySizeDto } from './create-inventory-size.dto';
import { BadRequestException } from '@nestjs/common';

export class UpdateInventoryDto {
  @IsOptional()
  @IsString()
  equipment_name?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  totalQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  availableQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  rental_price_per_hour?: number;

  // Optional update for the description field
  @IsOptional()
  @IsString()
  description?: string;

  @Transform(({ value }) => {
    try {
      return JSON.parse(value);
    } catch (e) {
      throw new BadRequestException('Invalid JSON format for schedules');
    }
  })
  @IsArray()
  @IsOptional()
  sizes: CreateInventorySizeDto[];
}
