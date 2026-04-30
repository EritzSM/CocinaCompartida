// src/security/auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AuthPayload {
  id?: string;
  sub?: string;
  username?: string;
  email?: string;
  url?: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const auth = req.headers['authorization'] as string | undefined;

    if (!auth) {
      throw new UnauthorizedException('Falta Authorization');
    }

    const [type, token] = auth.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Formato invalido');
    }

    try {
      const payload = this.jwt.verify<AuthPayload>(token);
      const userId = payload.sub ?? payload.id;

      if (!userId) {
        throw new UnauthorizedException('Token sin id');
      }

      req.user = {
        id: userId,
        username: payload.username,
        email: payload.email,
        url: payload.url,
      };

      return true;
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Token invalido o expirado');
    }
  }
}
