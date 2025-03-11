import { IsNotEmpty, IsString, IsInt, Min, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInventorySizeDto } from './create-inventory-size.dto';

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

  @IsOptional()
  @IsArray()
  //@ValidateNested({ each: true })
  @Type(() => CreateInventorySizeDto)
  sizes: CreateInventorySizeDto[];
}
