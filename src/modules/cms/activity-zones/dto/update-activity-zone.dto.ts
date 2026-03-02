import { PartialType } from '@nestjs/mapped-types';
import {
  IsOptional,
  IsBoolean,
  IsNumber,
  IsString,
  Matches,
} from 'class-validator';
import { CreateActivityZoneDto } from './create-activity-zone.dto';
import { Type } from 'class-transformer';

export class UpdateActivityZoneDto extends PartialType(CreateActivityZoneDto) {}
