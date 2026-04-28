import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '../../../src/security/auth.guard';

describe('Ver Perfil Security Backend', () => {
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

  // Verifica que sin header Authorization se rechaza el acceso.
  it('VerPerfil_CuandoNoHayAuthorization_DebeLanzarUnauthorized', () => {
    // Arrange
    const ctx = buildContext({});

    // Act
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);

    // Assert
  });

  // Verifica que el formato diferente a Bearer se rechaza.
  it('VerPerfil_CuandoFormatoNoBearer_DebeLanzarUnauthorized', () => {
    // Arrange
    const ctx = buildContext({ authorization: 'Basic token' });

    // Act
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);

    // Assert
  });

  // Verifica que un token inválido es rechazado.
  it('VerPerfil_CuandoTokenEsInvalido_DebeLanzarUnauthorized', () => {
    // Arrange
    const ctx = buildContext({ authorization: 'Bearer invalid' });
    (jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid');
    });

    // Act
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);

    // Assert
  });

  // Verifica que un token expirado es rechazado.
  it('VerPerfil_CuandoTokenEstaExpirado_DebeLanzarUnauthorized', () => {
    // Arrange
    const ctx = buildContext({ authorization: 'Bearer expired' });
    (jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('jwt expired');
    });

    // Act
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);

    // Assert
  });

  // Verifica que un token sin id/sub es rechazado.
  it('VerPerfil_CuandoTokenNoTieneId_DebeLanzarUnauthorized', () => {
    // Arrange
    const ctx = buildContext({ authorization: 'Bearer token' });
    (jwtService.verify as jest.Mock).mockReturnValue({ username: 'user' });

    // Act
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);

    // Assert
  });

  // Verifica que un token válido permite el acceso.
  it('VerPerfil_CuandoTokenEsValido_DebePermitirAcceso', () => {
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
