import { IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInventorySizeDto {
  // Optional field to support updating existing sizes
  @IsOptional()
  @IsInt()
  id?: number;

  @IsOptional()
  @IsString()
  size: string;

  @IsOptional()
  @Type(() => Number) // Automatically converts string to number
  quantity: number;

  // Optional descriptive field for the inventory size
  @IsOptional()
  @IsString()
  description?: string;
}
