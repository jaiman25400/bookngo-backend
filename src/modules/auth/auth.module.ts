import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CustomersService } from '../customers/customers.service';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../customers/customers.entity';
import { CustomerUser } from '../customer-users/customers-users.entity';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Import ConfigModule and ConfigService
import { CustomerUsersService } from '../customer-users/customer-users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer,CustomerUser]),
    JwtModule.registerAsync({
      imports: [ConfigModule], // Ensure ConfigModule is imported
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // Get the JWT_SECRET from the .env
        signOptions: { expiresIn: '1h' }, // Set expiration time for JWT
      }),
      inject: [ConfigService], // Inject ConfigService into the factory
    }),
    ConfigModule, // Ensure ConfigModule is imported to access .env variables
  ],
  controllers: [AuthController],
  providers: [AuthService, CustomersService,CustomerUsersService],
  exports: [AuthService],
})
export class AuthModule {}
