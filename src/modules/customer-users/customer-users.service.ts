import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CustomerUser } from './customers-users.entity';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CustomerUsersService {
  constructor(
    @InjectRepository(CustomerUser)
    private readonly customerUserRepository: Repository<CustomerUser>,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource, // Needed for transactions
  ) {}

  // 1️⃣ Invite a user: Insert new or re-send invite if inactive
  async inviteUser(
    email: string,
    name: string,
    customerId: number,
    role: string,
  ) {
    // Check for existing user
    const existingUser = await this.customerUserRepository.findOne({
      where: { email },
    });
    if (existingUser?.is_active) {
      throw new BadRequestException('User already exists and is active');
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex');
    let user: CustomerUser;

    // Create or update user entity
    if (existingUser) {
      existingUser.password_token = token;
      user = await this.customerUserRepository.save(existingUser);
    } else {
      user = this.customerUserRepository.create({
        email,
        name,
        customer: { id: customerId },
        role,
        password_token: token,
        is_active: false,
      });
      user = await this.customerUserRepository.save(user);
    }

    // Send invitation email
    await this.sendInviteEmail(email, token);
    return { message: 'Invitation sent successfully' };
  }

  // 2️⃣ Send email securely using environment variables
  async sendInviteEmail(email: string, token: string) {
    try {
      const transporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST'),
        port: this.configService.get<number>('SMTP_PORT'),
        secure: false,
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });

      const resetLink = `${this.configService.get<string>('FRONTEND_URL')}/setup-password?token=${token}`;

      const mailOptions = {
        from: this.configService.get<string>('EMAIL_FROM'),
        to: email,
        subject: 'Set Up Your Account',
        html: `<p>Hello,</p>
              <p>You have been invited to join. Click the link below to set your password:</p>
              <a href="${resetLink}" target="_blank">Set Your Password</a>
              <p>If you did not request this, you can safely ignore this email.</p>`,
      };

      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending invite email:', error);
      throw new InternalServerErrorException('Failed to send invitation email');
    }
  }

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
