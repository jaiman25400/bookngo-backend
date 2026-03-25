import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateOnboardedContentDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customer_id: number;

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
