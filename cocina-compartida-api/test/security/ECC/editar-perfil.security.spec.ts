import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '../../../src/security/auth.guard';

describe('Editar Perfil Security Backend', () => {
  let guard: AuthGuard;
  let jwtService: Partial<JwtService>;

  function buildContext(headers: Record<string, string> = {}) {
    const req = { headers, user: undefined } as any;
    return {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as ExecutionContext;
  }

  beforeEach(() => {
    jwtService = {
      verify: jest.fn(),
    };
    guard = new AuthGuard(jwtService as JwtService);
  });

  // Verifica rechazo cuando falta Authorization.
  it('EditarPerfil_CuandoNoHayAuthorization_DebeLanzarUnauthorized', () => {
    // Arrange
    const ctx = buildContext({});

    // Act
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);

    // Assert
  });

  // Verifica rechazo con token invalido.
  it('EditarPerfil_CuandoTokenEsInvalido_DebeLanzarUnauthorized', () => {
    // Arrange
    const ctx = buildContext({ authorization: 'Bearer invalid' });
    (jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid');
    });

    // Act
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);

    // Assert
  });

  // Verifica rechazo con token expirado.
  it('EditarPerfil_CuandoTokenEstaExpirado_DebeLanzarUnauthorized', () => {
    // Arrange
    const ctx = buildContext({ authorization: 'Bearer expired' });
    (jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('jwt expired');
    });

    // Act
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);

    // Assert
  });

  // Verifica rechazo cuando el token no tiene id.
  it('EditarPerfil_CuandoTokenNoTieneId_DebeLanzarUnauthorized', () => {
    // Arrange
    const ctx = buildContext({ authorization: 'Bearer token' });
    (jwtService.verify as jest.Mock).mockReturnValue({ username: 'user' });

    // Act
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);

    // Assert
  });

  // Verifica acceso permitido con token valido.
  it('EditarPerfil_CuandoTokenEsValido_DebePermitirAcceso', () => {
    // Arrange
    const ctx = buildContext({ authorization: 'Bearer token' });
    (jwtService.verify as jest.Mock).mockReturnValue({
      sub: '1',
      username: 'user',
      email: 'user@test.com',
      url: 'av.png',
    });

    // Act
    const result = guard.canActivate(ctx);

    // Assert
    expect(result).toBe(true);
  });
});
