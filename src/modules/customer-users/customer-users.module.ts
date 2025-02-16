import { Module } from '@nestjs/common';
import { CustomerUsersService } from './customer-users.service';
import { CustomerUsersController } from './customer-users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerUser } from './customers-users.entity'; // Import Customer entity
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerUser]), ConfigModule],
  providers: [CustomerUsersService],
  controllers: [CustomerUsersController],
})
export class CustomerUsersModule {}
