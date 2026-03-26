import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RoleGuard } from '../security/role.guard';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ROLE GUARD – Pruebas por camino (AAA + jest.fn mocks)
//
//  Guard:   RoleGuard.canActivate(context)
//  Valida que el usuario sea dueño de la receta o que userId coincida
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('RoleGuard – Pruebas por camino', () => {
  let guard: RoleGuard;
  let mockJwt: { verify: jest.Mock };
  let mockRecipesService: { findOne: jest.Mock };

  beforeEach(() => {
    mockJwt = { verify: jest.fn() };
    mockRecipesService = { findOne: jest.fn() };
    guard = new RoleGuard(mockJwt as any, mockRecipesService as any);
  });

  function makeContext(headers: any, params: any = {}, body: any = {}) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
          params,
          body,
          header: (h: string) => headers[h.toLowerCase()],
        }),
      }),
    } as any;
  }

  // ──────────────────────────────────────────────────────────
  //  C1: Sin authorization → ForbiddenException
  // ──────────────────────────────────────────────────────────
  describe('C1: Sin authorization header', () => {
    it('C1-T1: lanza ForbiddenException si no hay header authorization', async () => {
      // Arrange
      const ctx = makeContext({});

      // Act & Assert
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C2: Con params.id → verifica dueño de receta
  // ──────────────────────────────────────────────────────────
  describe('C2: Verificación por params.id (dueño de receta)', () => {
    it('C2-T1: retorna true si el usuario es dueño de la receta', async () => {
      // Arrange
      mockJwt.verify.mockReturnValue({ id: 'u1', username: 'chef' });
      mockRecipesService.findOne.mockResolvedValue({ id: 'r1', user: { id: 'u1' } });
      const ctx = makeContext({ authorization: 'Bearer valid-token' }, { id: 'r1' });

      // Act
      const result = await guard.canActivate(ctx);

      // Assert
      expect(result).toBe(true);
    });

    it('C2-T2: lanza ForbiddenException si el usuario NO es dueño', async () => {
      // Arrange
      mockJwt.verify.mockReturnValue({ id: 'u1', username: 'chef' });
      mockRecipesService.findOne.mockResolvedValue({ id: 'r1', user: { id: 'u2' } });
      const ctx = makeContext({ authorization: 'Bearer valid-token' }, { id: 'r1' });

      // Act & Assert
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C3: Sin params.id → verifica body.userId
  // ──────────────────────────────────────────────────────────
  describe('C3: Verificación por body.userId', () => {
    it('C3-T1: retorna true si body.userId coincide con payload.id', async () => {
      // Arrange
      mockJwt.verify.mockReturnValue({ id: 'u1', username: 'chef' });
      const ctx = makeContext({ authorization: 'Bearer valid-token' }, {}, { userId: 'u1' });

      // Act
      const result = await guard.canActivate(ctx);

      // Assert
      expect(result).toBe(true);
    });

    it('C3-T2: lanza ForbiddenException si body.userId NO coincide', async () => {
      // Arrange
      mockJwt.verify.mockReturnValue({ id: 'u1', username: 'chef' });
      const ctx = makeContext({ authorization: 'Bearer valid-token' }, {}, { userId: 'u99' });

      // Act & Assert
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C4: Receta no existe → NotFoundException
  // ──────────────────────────────────────────────────────────
  describe('C4: Receta no existe', () => {
    it('C4-T1: lanza NotFoundException si findOne lanza NotFoundException', async () => {
      // Arrange
      mockJwt.verify.mockReturnValue({ id: 'u1' });
      mockRecipesService.findOne.mockRejectedValue(new NotFoundException('not found'));
      const ctx = makeContext({ authorization: 'Bearer valid-token' }, { id: 'r-none' });

      // Act & Assert
      await expect(guard.canActivate(ctx)).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C5: Token inválido → ForbiddenException
  // ──────────────────────────────────────────────────────────
  describe('C5: Token inválido', () => {
    it('C5-T1: lanza ForbiddenException si jwt.verify falla', async () => {
      // Arrange
      mockJwt.verify.mockImplementation(() => { throw new Error('invalid token'); });
      const ctx = makeContext({ authorization: 'Bearer bad-token' }, { id: 'r1' });

      // Act & Assert
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C6: Extracción del token
  // ──────────────────────────────────────────────────────────
  describe('C6: Extracción del token', () => {
    it('C6-T1: extrae token después de "Bearer "', async () => {
      // Arrange
      mockJwt.verify.mockReturnValue({ id: 'u1' });
      mockRecipesService.findOne.mockResolvedValue({ id: 'r1', user: { id: 'u1' } });
      const ctx = makeContext({ authorization: 'Bearer my-token-123' }, { id: 'r1' });

      // Act
      await guard.canActivate(ctx);

      // Assert
      expect(mockJwt.verify).toHaveBeenCalledWith('my-token-123');
    });

    it('C6-T2: usa token completo si no tiene prefijo Bearer', async () => {
      // Arrange
      mockJwt.verify.mockReturnValue({ id: 'u1' });
      mockRecipesService.findOne.mockResolvedValue({ id: 'r1', user: { id: 'u1' } });
      const ctx = makeContext({ authorization: 'raw-token' }, { id: 'r1' });

      // Act
      await guard.canActivate(ctx);

      // Assert
      expect(mockJwt.verify).toHaveBeenCalledWith('raw-token');
    });
  });
});
