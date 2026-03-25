import { AuthGuard } from '../security/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: Partial<JwtService>;

  // Helper para crear un mock de ExecutionContext
  function createMockContext(headers: Record<string, string> = {}): ExecutionContext {
    const mockRequest = { headers, user: undefined };
    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as any;
  }

  beforeEach(() => {
    // Arrange global: mock del JwtService
    jwtService = {
      verify: jest.fn(),
    };
    guard = new AuthGuard(jwtService as JwtService);
  });

  // PU-02 / RP-03 / C-03: Sin token → Error 401

  describe('PU-02 / RP-03 / C-03 Sin token de autorización', () => {
    it('debe lanzar UnauthorizedException si no hay header Authorization', () => {
      // Arrange
      const ctx = createMockContext({});

      // Act & Assert
      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException si el header Authorization está vacío', () => {
      // Arrange
      const ctx = createMockContext({ authorization: '' });

      // Act & Assert
      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });
  });


  // PU-03: Token inválido o expirado → Error 401

  describe('PU-03 Token inválido o expirado', () => {
    it('debe lanzar UnauthorizedException si el token es inválido', () => {
      // Arrange
      const ctx = createMockContext({ authorization: 'Bearer token-invalido' });
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('invalid token');
      });

      // Act & Assert
      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException si el token está expirado', () => {
      // Arrange
      const ctx = createMockContext({ authorization: 'Bearer token-expirado' });
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('jwt expired');
      });

      // Act & Assert
      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException si el formato no es Bearer', () => {
      // Arrange
      const ctx = createMockContext({ authorization: 'Basic some-credentials' });

      // Act & Assert
      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException si solo tiene Bearer sin token', () => {
      // Arrange
      const ctx = createMockContext({ authorization: 'Bearer ' });

      // Act & Assert
      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });
  });

  // Token válido → permite acceso
  describe('Token válido permite acceso', () => {
    it('debe retornar true y setear req.user cuando el token es válido con sub', () => {
      // Arrange
      const mockReq = { headers: { authorization: 'Bearer valid-token' }, user: undefined } as any;
      const ctx = {
        switchToHttp: () => ({
          getRequest: () => mockReq,
        }),
      } as any;
      (jwtService.verify as jest.Mock).mockReturnValue({
        sub: 'uuid-user',
        username: 'testuser',
        email: 'test@email.com',
        url: 'http://avatar.png',
      });

      // Act
      const result = guard.canActivate(ctx);

      // Assert
      expect(result).toBe(true);
      expect(mockReq.user).toEqual({
        id: 'uuid-user',
        username: 'testuser',
        email: 'test@email.com',
        url: 'http://avatar.png',
      });
    });

    it('debe usar payload.id si no hay payload.sub', () => {
      // Arrange
      const mockReq = { headers: { authorization: 'Bearer valid-token' }, user: undefined } as any;
      const ctx = {
        switchToHttp: () => ({
          getRequest: () => mockReq,
        }),
      } as any;
      (jwtService.verify as jest.Mock).mockReturnValue({
        id: 'uuid-from-id',
        username: 'testuser',
        email: 'test@email.com',
        url: null,
      });

      // Act
      const result = guard.canActivate(ctx);

      // Assert
      expect(result).toBe(true);
      expect(mockReq.user.id).toBe('uuid-from-id');
    });
  });


  // Camino adicional: Token sin id ni sub → Error 401
  describe('Camino adicional Token sin id ni sub', () => {
    it('debe lanzar UnauthorizedException si el token no tiene id ni sub', () => {
      // Arrange
      const ctx = createMockContext({ authorization: 'Bearer token-sin-id' });
      (jwtService.verify as jest.Mock).mockReturnValue({
        username: 'testuser',
        email: 'test@email.com',
      });

      // Act & Assert
      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });
  });
});
