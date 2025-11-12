import { IsOptional, IsString, IsEmail, IsArray } from 'class-validator';

export class CreateCustomerDetailDto {
  @IsOptional()
  @IsString()
  home_tagLine?: string;

  @IsOptional()
  customer_display_email?: string;

  @IsString()
  customer_slug?: string;

  @IsOptional()
  @IsString()
  customer_display_name?: string;

  @IsOptional()
  @IsString()
  customer_description?: string;

  @IsOptional()
  @IsString()
  customer_longitude?: string;

  @IsOptional()
  @IsString()
  customer_latitude?: string;
  
  @IsOptional()
  @IsString()
  customer_address?: string;

  @IsOptional()
  @IsString()
  customer_city?: string;

  @IsOptional()
  @IsString()
  customer_state?: string;

  @IsOptional()
  @IsString()
  customer_zip?: string;

  @IsOptional()
  @IsString()
  about_us?: string;

  @IsOptional()
  @IsString()
  features?: string;
}
