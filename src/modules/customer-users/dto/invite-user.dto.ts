import { IsString, IsEmail, IsInt, Min, IsNotEmpty } from 'class-validator';

export class InviteUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty()
  email: string;

  @IsString({ message: 'Name is required' })
  @IsNotEmpty()
  name: string;


  @IsString({ message: 'Role is required' })
  @IsNotEmpty()
  role: string;
}
