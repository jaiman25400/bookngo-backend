import { PartialType } from '@nestjs/mapped-types';
import {
  IsOptional,
  IsBoolean,
  IsNumber,
  IsString,
  Matches,
} from 'class-validator';
import { CreateActivityZoneDto } from './create-activity-zone.dto';
import { Type } from 'class-transformer';

export class UpdateActivityZoneDto extends PartialType(CreateActivityZoneDto) {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number) // Ensure numbers are parsed correctly
  capacity?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price?: number;

}
