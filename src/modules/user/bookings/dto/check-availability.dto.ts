import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class checkSlotAvailabilityByDate {
  @IsString()
  @IsNotEmpty()
  date: string; // Format: YYYY-MM-DD

  @IsNumber()
  @IsNotEmpty()
  activityId: number;
} 