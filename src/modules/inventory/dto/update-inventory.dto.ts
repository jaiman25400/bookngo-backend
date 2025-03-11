import { IsOptional, IsString, IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInventorySizeDto } from './create-inventory-size.dto';

export class UpdateInventoryDto {
  @IsOptional()
  @IsString()
  equipment_name?: string; // Fix naming to match entity

  @IsOptional()
  @Type(() => Number) // Automatically converts string to number
  @Min(1)
  totalQuantity?: number;

  @IsOptional()
  @Type(() => Number) // Automatically converts string to number
  availableQuantity?: number;

  @IsOptional()
  @Type(() => Number) // Automatically converts string to number
  rental_price_per_hour?: number;
  
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInventorySizeDto)
  sizes?: CreateInventorySizeDto[]; // Correct DTO structure for sizes
}
