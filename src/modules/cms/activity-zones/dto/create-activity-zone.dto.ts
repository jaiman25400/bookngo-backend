// create-activity-zone.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  IsInt,
  IsNumber,
  IsDate,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AgeGroup, ZoneStatus } from '../entities/activity-zone.entity';

export class CreateActivityZoneDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(AgeGroup)
  age_group?: AgeGroup | null;

  @IsOptional()
  @IsString()
  zone_tagline?: string;
  
  @IsNotEmpty()
  @IsEnum(ZoneStatus)
  status?: ZoneStatus = ZoneStatus.ACTIVE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  capacity?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  price?: number;
}
