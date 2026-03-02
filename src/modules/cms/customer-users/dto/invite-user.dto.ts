import { IsString, IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class InviteUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  /** Optional. If omitted, default dev password is used (no email sent). */
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password?: string;
}
