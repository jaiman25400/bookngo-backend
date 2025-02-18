import { IsNotEmpty, IsString, IsInt, Min, IsOptional } from 'class-validator';

export class CreateInventorySizeDto {
  @IsOptional() // The 'id' field is optional for new sizes but required for updates.
  @IsInt()
  id?: number; // Optional field for updating an existing size

  @IsNotEmpty()
  @IsString()
  size: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;
}
