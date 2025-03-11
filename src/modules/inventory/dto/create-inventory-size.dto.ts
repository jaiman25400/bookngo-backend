import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInventorySizeDto {
  @IsOptional() // The 'id' field is optional for new sizes but required for updates.
  @IsInt()
  id?: number; // Optional field for updating an existing size
  
  @IsOptional() // The 'id' field is optional for new sizes but required for updates.
//  @IsNotEmpty()
  @IsString()
  size: string;

  @IsOptional() // The 'id' field is optional for new sizes but required for updates.
 // @IsNotEmpty()
  @Type(() => Number) // Automatically converts string to number
  quantity: number;
}
