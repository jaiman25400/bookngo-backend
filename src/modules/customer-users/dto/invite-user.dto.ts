import { IsString, IsEmail, IsInt, Min, IsNotEmpty } from 'class-validator';

export class InviteUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(1) // Ensure customerId is a positive integer
  customerId: number;

  @IsString()
  @IsNotEmpty()
  role: string;
}
