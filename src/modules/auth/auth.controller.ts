import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  Req,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Public() // ✅ This route is open and does not require a token
  @Post('login')
  async login(
    @Body() loginDto: { email: string; password: string },
    @Res() res: Response,
  ) {
    try {
      const { email, password } = loginDto;

      if (!email || !password) {
        throw new UnauthorizedException('Email and password are required');
      }

      const user = await this.authService.validateUser(email, password);

      this.logger.log(`User logged in: ${user.email}`);

      const { access_token } = await this.authService.login(user);

      res.cookie('token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000,
      });

      return res.json({ message: 'Login successful' });
    } catch (error) {
      this.logger.error(
        `Login failed for user: ${loginDto.email}`,
        error.stack,
      );

      if (error instanceof UnauthorizedException) {
        return res.status(401).json({ message: error.message });
      }

      throw new InternalServerErrorException('An error occurred during login');
    }
  }

  @Get('me')
  async getMe(@Req() req: Request) {
    return req.user; // Already attached by JwtAuthGuard
  }
  

  @Post('logout')
  async logout(@Res() res: Response) {
    try {
      res.cookie('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0),
        path: '/',
      });

      this.logger.log('User logged out successfully');
      return res.json({ message: 'Logged out successfully' });
    } catch (error) {
      this.logger.error('Logout error', error.stack);
      throw new InternalServerErrorException('An error occurred during logout');
    }
  }
}
