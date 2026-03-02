import { IsBoolean, IsOptional } from 'class-validator';

export class CheckInDto {
  @IsOptional()
  @IsBoolean()
  paymentVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  waiverSigned?: boolean;
}
