// src/activities/dto/update-activity.dto.ts
import { IsArray, IsBoolean, IsDate, IsNumber, IsOptional, IsString, ValidateNested, Matches } from 'class-validator';
import { Type } from 'class-transformer';

class ActivityScheduleDto {
  @IsString()
  day: string;

  @IsOptional()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
  start_time?: string;

  @IsOptional()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
  end_time?: string;

  @IsBoolean()
  is_24hours: boolean;

  @IsBoolean()
  is_holiday: boolean;
}

class ActivityHolidayDto {
  @IsDate()
  @Type(() => Date)
  date: Date;
}

export class UpdateActivityDto {
  @IsOptional()
  @IsString()
  activity_name?: string;

  @IsOptional()
  @IsNumber()
  base_price?: number;

  @IsOptional()
  @IsNumber()
  duration_hours?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  start_date?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  end_date?: Date;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsArray()
  zone_ids?: number[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ActivityScheduleDto)
  schedules?: ActivityScheduleDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ActivityHolidayDto)
  holidays?: ActivityHolidayDto[];
}
