import { IsOptional, IsString, IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInventorySizeDto } from './create-inventory-size.dto';

export class UpdateInventoryDto {
  @IsOptional()
  @IsString()
  equipment_name?: string; // Fix naming to match entity

  @IsOptional()
  @IsInt()
  @Min(1)
  totalQuantity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  availableQuantity?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInventorySizeDto)
  sizes?: CreateInventorySizeDto[]; // Correct DTO structure for sizes
}
