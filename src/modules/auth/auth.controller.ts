import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';  // Use Response from express directly
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}

  @Post('login')
  async login(
    @Body() loginDto: { email: string; password: string },
    @Res() res: Response,  // Use the Response type from express
  ) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { access_token } = await this.authService.login(user);

    // Set JWT token in HttpOnly cookie
    res.cookie('token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Ensure secure cookie in production
      sameSite: 'strict',
      maxAge: 3600000, // 1-hour expiration
    });

    return res.json({
      message: 'Login successful'
    });
  }

  @Get('me')
  async getMe(@Req() req: Request & { cookies: any }) {
    try {
      const token = req.cookies?.token; // Get token from cookies

      if (!token) {
        throw new UnauthorizedException('No token found');
      }

      const decoded = this.jwtService.verify(token); // Verify token

      return await this.authService.getUserById(decoded.sub); // Fetch user details
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    // Clear the token cookie by setting an expired date
    res.cookie('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Ensure secure cookie in production
      sameSite: 'strict',
      expires: new Date(0), // Expire immediately
      path: '/', // Ensure the path matches the token path
    });

    return res.json({
      message: 'Logged out successfully',
    });
  }
}
