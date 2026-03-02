// src/activities/dto/create-activity.dto.ts
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  ActivityType,
  AgeGroup,
  BookingType,
} from '../enums/activity-type.enum';
import { BadRequestException } from '@nestjs/common';

export class CreateActivityDto {
  @IsString()
  activity_name: string;

  @IsString()
  activity_description: string;

  @Type(() => Number)
  @IsNumber()
  base_price: number;

  @Min(0.5) // Minimum 30 minutes
  @IsNumber()
  @Type(() => Number)
  duration_hours?: number;

  @IsDate()
  @Type(() => Date)
  start_date: Date;

  @IsDate()
  @Type(() => Date)
  end_date: Date;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24 * 60) // Max 24 hours in minutes
  @Type(() => Number)
  slot_interval_minutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  max_per_slot?: number;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim().toLowerCase() === 'true';
    }
    return value === true;
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsOptional()
  @IsEnum(AgeGroup)
  age_group?: AgeGroup | null;

  @IsOptional()
  @IsEnum(ActivityType)
  activity_type: ActivityType | null;

  @IsOptional()
  @IsString()
  activity_tagline?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  requires_waiver?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  provides_rentals?: boolean;

  @IsOptional()
  safety_instructions?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  redirect_to_external_website?: boolean;

  @IsOptional()
  @IsString()
  external_booking_url?: string | null;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    try {
      return JSON.parse(value);
    } catch (e) {
      throw new BadRequestException('Invalid JSON format for schedules');
    }
  })
  zone_id?: string;

  @IsOptional()
  booking_type?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    try {
      return JSON.parse(value);
    } catch (e) {
      throw new BadRequestException('Invalid JSON format for schedules');
    }
  })
  schedules?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    try {
      return JSON.parse(value);
    } catch (e) {
      throw new BadRequestException('Invalid JSON format for schedules');
    }
  })
  holidays?: string;
}
