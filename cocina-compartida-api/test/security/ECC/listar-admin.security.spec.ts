import { ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RoleGuard } from '../../../src/security/role.guard';

function buildContext(authHeader: string | undefined, body: Record<string, any> = {}) {
  const request = {
    params: {},
    body,
    header: jest.fn().mockReturnValue(authHeader),
  };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as any;
}

describe('Listar Admin Security Backend', () => {
  let jwtService: Partial<JwtService>;
  let recipesService: any;

  beforeEach(() => {
    jwtService = { verify: jest.fn() };
    recipesService = { findOne: jest.fn() };
  });

  it('ListarAdmin_CuandoNoHayAuthorization_DebeLanzarForbidden', async () => {
    // Arrange
    const guard = new RoleGuard(jwtService as JwtService, recipesService);
    const ctx = buildContext(undefined);

    // Act
    const action = guard.canActivate(ctx);

    // Assert
    await expect(action).rejects.toThrow(ForbiddenException);
  });

  it('ListarAdmin_CuandoUserIdNoCoincide_DebeLanzarForbidden', async () => {
    // Arrange
    (jwtService.verify as jest.Mock).mockReturnValue({ id: 'u1' });
    const guard = new RoleGuard(jwtService as JwtService, recipesService);
    const ctx = buildContext('Bearer token', { userId: 'u2' });

    // Act
    const action = guard.canActivate(ctx);

    // Assert
    await expect(action).rejects.toThrow(ForbiddenException);
  });
});
