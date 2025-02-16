import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CustomersService } from '../customers/customers.service';
import { ConfigService } from '@nestjs/config'; // Import ConfigService
import { CustomerUsersService } from '../customer-users/customer-users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly customerService: CustomersService,
    private readonly customerUserService: CustomerUsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService, // Inject ConfigService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.customerUserService.findOneByEmail(email);
    if (!user) return null;

    // Compare password using bcryptjs
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null; // Passwords don't match

    return user;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };

    // Get JWT_SECRET from environment variables
    const secretKey = this.configService.get<string>('JWT_SECRET'); // Use the secret from .env

    return {
      access_token: this.jwtService.sign(payload, {
        secret: secretKey, // Use the secret to sign the token
      }),
    };
  }

  async getUserById(userId: number) {
    const user = await this.customerUserService.findOneById(userId);

    if (!user) return null;
    // Extract customer_id manually
    const { password, password_token, customer, ...safeUser } = user;

    return {
      ...safeUser,
      customer_id: customer?.id ?? null, // Ensure customer_id is returned if available
    };
  }
}
