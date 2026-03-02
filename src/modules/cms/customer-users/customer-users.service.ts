import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CustomerUser } from './customers-users.entity';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';

/** Default password for new users when email invite is disabled (development). */
const DEFAULT_DEV_PASSWORD = 'TempPass123!';

@Injectable()
export class CustomerUsersService {
  constructor(
    @InjectRepository(CustomerUser)
    private readonly customerUserRepository: Repository<CustomerUser>,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Invite a user: create or reactivate, set password, activate.
   * Email sending is disabled in development; user can log in immediately with default or provided password.
   */
  async inviteUser(
    email: string,
    name: string,
    customerId: number,
    role: string,
    password?: string,
  ) {
    const existingUser = await this.customerUserRepository.findOne({
      where: { email },
    });
    if (existingUser?.is_active) {
      throw new BadRequestException('User already exists and is active');
    }

    const plainPassword = password && password.trim() ? password : DEFAULT_DEV_PASSWORD;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    let user: CustomerUser;
    if (existingUser) {
      existingUser.password = hashedPassword;
      existingUser.password_token = null;
      existingUser.is_active = true;
      existingUser.name = name;
      existingUser.role = role;
      user = await this.customerUserRepository.save(existingUser);
    } else {
      user = this.customerUserRepository.create({
        email,
        name,
        customer: { id: customerId },
        role,
        password: hashedPassword,
        password_token: null,
        is_active: true,
      });
      user = await this.customerUserRepository.save(user);
    }

    // Email sending disabled for development – user is active and can log in with the password above
    // await this.sendInviteEmail(email, token);

    return {
      message: 'User created successfully. They can log in with the provided or default password.',
      email: user.email,
      defaultPassword: password ? undefined : DEFAULT_DEV_PASSWORD,
    };
  }

  // Email invite disabled in development. Uncomment and use when SMTP is ready.
  // async sendInviteEmail(email: string, token: string) {
  //   try {
  //     const transporter = nodemailer.createTransport({ ... });
  //     await transporter.sendMail(mailOptions);
  //   } catch (error) {
  //     console.error('Error sending invite email:', error);
  //     throw new InternalServerErrorException('Failed to send invitation email');
  //   }
  // }

  // 3️⃣ Verify token & set password
  async setPassword(token: string, newPassword: string) {
    try {
      const user = await this.customerUserRepository.findOne({
        where: { password_token: token },
      });

      if (!user) {
        throw new BadRequestException('Invalid or expired token');
      }

      user.password = await bcrypt.hash(newPassword, 10); // Hash password
      user.password_token = null; // Clear token
      user.is_active = true; // Activate user

      await this.customerUserRepository.save(user);
      return { message: 'Password set successfully' };
    } catch (error) {
      console.error('Error setting password:', error);
      throw new InternalServerErrorException('Failed to set password');
    }
  }

  async findOneByEmail(email: string): Promise<CustomerUser | null> {
    return this.customerUserRepository.findOne({
      where: { email },
      relations: ['customer'], // ✅ Ensure customer relation is loaded
    });
  }

  async findOneById(id: number): Promise<CustomerUser | null> {
    return this.customerUserRepository.findOne({
      where: { id },
      relations: ['customer'], // Fetch the customer relation
    });
  }

  async getTeam(customerId: number): Promise<CustomerUser[]> {
    return this.customerUserRepository.find({
      where: { customer: { id: customerId } }, // Fetch users by customer_id
      //  relations: ['customer'], // Include the customer relation
      select: ['id', 'email', 'role', 'is_active', 'name', 'created_at'], // Exclude sensitive fields
    });
  }
}
