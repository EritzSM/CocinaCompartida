import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '../../../src/security/auth.guard';
import { Afirmar } from '../../screenplay/fluent/Afirmar';

describe('Favoritos Bookmarks Security Backend', () => {
  let jwt: Partial<JwtService>;
  let guard: AuthGuard;

  function context(authorization?: string) {
    const req: any = { headers: {} };
    if (authorization) req.headers.authorization = authorization;
    return {
      req,
      ctx: {
        switchToHttp: () => ({ getRequest: () => req }),
      } as any,
    };
  }

  beforeEach(() => {
    jwt = { verify: jest.fn() };
    guard = new AuthGuard(jwt as JwtService);
  });

  it('Dado una accion de favorito sin token, cuando pasa por AuthGuard, entonces responde Unauthorized', async () => {
    const { ctx } = context();

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('Dado un token invalido, cuando marca favorito, entonces responde Unauthorized', async () => {
    const { ctx } = context('Bearer token-invalido');
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid');
    });

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('Dado un token valido, cuando marca favorito, entonces adjunta usuario autenticado', () => {
    const { ctx, req } = context('Bearer token-valido');
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'u1', username: 'chef', email: 'chef@test.com' });

    const permitido = guard.canActivate(ctx);

    Afirmar.que(permitido).esIgualA(true);
    Afirmar.que(req.user).contieneObjeto({ id: 'u1', username: 'chef' });
  });
});
