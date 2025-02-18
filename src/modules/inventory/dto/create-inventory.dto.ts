import { IsNotEmpty, IsString, IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInventorySizeDto } from './create-inventory-size.dto';

export class CreateInventoryDto {
  @IsNotEmpty()
  @IsInt()
  customer_id: number;

  @IsNotEmpty()
  @IsString()
  equipment_name: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  totalQuantity: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  availableQuantity: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInventorySizeDto)
  sizes: CreateInventorySizeDto[];
}
