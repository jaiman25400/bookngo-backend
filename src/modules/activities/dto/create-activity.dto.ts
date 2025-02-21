// src/activities/dto/create-activity.dto.ts
import { IsNotEmpty, IsInt, IsString, IsDateString, IsBoolean, Min, IsOptional } from 'class-validator';

export class CreateActivityDto {
  @IsNotEmpty()
  @IsInt()
  customer_id: number; // ✅ Ensures activity belongs to a specific customer

  @IsNotEmpty()
  @IsString()
  activity_name: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  base_price: number; // ✅ Activity price

  @IsOptional()
  @IsInt()
  duration_hours?: number;

  @IsOptional()
  @IsString()
  start_time?: string; // e.g., "08:00:00"

  @IsOptional()
  @IsString()
  end_time?: string; // e.g., "21:30:00"

  @IsOptional()
  @IsDateString()
  start_date?: Date;

  @IsOptional()
  @IsDateString()
  end_date?: Date;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
