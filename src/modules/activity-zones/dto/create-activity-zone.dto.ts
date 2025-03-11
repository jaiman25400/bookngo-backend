import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateActivityZoneDto {
  @IsNotEmpty()
  @IsString()
  name: string; // Zone name (required)

  @IsNotEmpty()
  @IsString()
  description: string; // Zone description (required)

  @IsOptional()
  @Type(() => Number) // Automatically converts string to number
  capacity?: number; // Maximum capacity (optional)

  @IsOptional()
  @Type(() => Number) // Automatically converts string to number
  price?: number; // Price for this zone (optional)
}
