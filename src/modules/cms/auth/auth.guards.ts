import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from './public.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If route is marked as public, allow access
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.token; // Get token from cookies

    if (!token) {
      throw new UnauthorizedException('Authentication token missing');
    }

    try {
      const payload = this.jwtService.verify(token);
      request.user = payload; // Attach user to request
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
