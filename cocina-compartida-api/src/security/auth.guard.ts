// src/security/auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const auth = req.headers['authorization'] as string | undefined;
    if (!auth) throw new UnauthorizedException('Falta Authorization');

    const [type, token] = auth.split(' ');
    if (type !== 'Bearer' || !token) throw new UnauthorizedException('Formato inválido');

    try {
      const p = this.jwt.verify(token); 
      req.user = {
        id: p.sub ?? p.id,     
        username: p.username,
        email: p.email,
        url: p.url,
      };
      if (!req.user.id) throw new UnauthorizedException('Token sin id');
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
