// slope-params.dto.ts
import { IsString } from 'class-validator';

export class SlopeParamsDto {
  @IsString()
  region: string;
}
