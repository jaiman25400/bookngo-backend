import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CustomerUsersService } from '../customer-users/customer-users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly customerUserService: CustomerUsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const trimmedEmail = email?.trim?.() ?? '';
      const trimmedPassword = password?.trim?.() ?? '';
      this.logger.log(`Validating user: ${trimmedEmail}`);

      const user = await this.customerUserService.findOneByEmail(trimmedEmail);
      if (!user) {
        this.logger.warn(`User not found: ${trimmedEmail}`);
        throw new UnauthorizedException('Invalid email or password');
      }

      if (!user.password || user.password === '') {
        this.logger.warn(`User has no password set: ${trimmedEmail}`);
        throw new UnauthorizedException('Invalid email or password');
      }

      const isMatch = await bcrypt.compare(trimmedPassword, user.password);
      if (!isMatch) {
        this.logger.warn(`Invalid password for user: ${trimmedEmail}`);
        throw new UnauthorizedException('Invalid email or password');
      }

      return user;
    } catch (error) {
      this.logger.error(`Error validating user: ${email}`, error.stack);
      throw error instanceof UnauthorizedException
        ? error
        : new InternalServerErrorException(
            'An error occurred during validation',
          );
    }
  }

  async login(user: any) {
    try {
      const payload = {
        email: user.email,
        sub: user.id,
        customer: user.customer.id,
        role: user.role,
        name: user.name,
      };

      const secretKey = this.configService.get<string>('JWT_SECRET');

      const accessToken = this.jwtService.sign(payload, {
        secret: secretKey,
        expiresIn: '1h', // Set token expiration time
      });

      return { access_token: accessToken };
    } catch (error) {
      this.logger.error(
        `Error during login for user: ${user.email}`,
        error.stack,
      );
      throw new InternalServerErrorException('An error occurred during login');
    }
  }

  async getUserById(userId: number) {
    try {
      const user = await this.customerUserService.findOneById(userId);
      if (!user) {
        this.logger.warn(`User not found with ID: ${userId}`);
        throw new UnauthorizedException('User not found');
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, password_token, customer, ...safeUser } = user;
      return {
        ...safeUser,
        customer_id: customer?.id ?? null,
      };
    } catch (error) {
      this.logger.error(`Error fetching user by ID: ${userId}`, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while fetching user details',
      );
    }
  }
}
