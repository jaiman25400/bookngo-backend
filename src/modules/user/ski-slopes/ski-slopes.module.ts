import { Module } from '@nestjs/common';
import { SkiSlopesController } from './ski-slopes.controller';
import { SkiSlopesService } from './ski-slopes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerDetail } from '../../cms/customers/entities/customers-detail.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerDetail])],
  controllers: [SkiSlopesController],
  providers: [SkiSlopesService],
})
export class SkiSlopesModule {}
