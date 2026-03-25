import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OnboardIceSkatingClientDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  /** Region/state for filtering (e.g. Ontario). Defaults to city if not provided. */
  @IsOptional()
  @IsString()
  state?: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsString()
  about_us?: string;

  @IsOptional()
  @IsString()
  activity_description?: string;

  @IsOptional()
  @IsString()
  activity_tagline?: string;
}
