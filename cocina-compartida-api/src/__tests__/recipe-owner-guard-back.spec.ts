import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RecipeOwnerGuard } from '../security/recipe-owner.guard';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RECIPE OWNER GUARD – Pruebas por camino (AAA + jest.fn mocks)
//
//  Guard:   RecipeOwnerGuard.canActivate(ctx)
//  Valida que req.user sea el dueño de la receta
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('RecipeOwnerGuard – Pruebas por camino', () => {
  let guard: RecipeOwnerGuard;
  let mockRecipesService: { findOne: jest.Mock };

  beforeEach(() => {
    mockRecipesService = { findOne: jest.fn() };
    guard = new RecipeOwnerGuard(mockRecipesService as any);
  });

  function makeContext(user: any, params: any = {}) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user, params }),
      }),
    } as any;
  }

  // ──────────────────────────────────────────────────────────
  //  C1: Sin userId → ForbiddenException
  // ──────────────────────────────────────────────────────────
  describe('C1: Sin usuario autenticado', () => {
    it('C1-T1: lanza ForbiddenException si no hay userId', async () => {
      // Test Double: Dummy – user=undefined, contexto mínimo sin comportamiento
      // Arrange
      const ctx = makeContext(undefined, { id: 'r1' });

      // Act & Assert
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C2: Sin recipeId → NotFoundException
  // ──────────────────────────────────────────────────────────
  describe('C2: Sin recipeId en params', () => {
    it('C2-T1: lanza NotFoundException si no hay recipeId', async () => {
      // Test Double: Dummy – params vacíos, objeto sin comportamiento esperado
      // Arrange
      const ctx = makeContext({ id: 'u1' }, {});

      // Act & Assert
      await expect(guard.canActivate(ctx)).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C3: Usuario es dueño → true
  // ──────────────────────────────────────────────────────────
  describe('C3: Usuario es dueño de la receta', () => {
    it('C3-T1: retorna true si el usuario es dueño', async () => {
      // Test Double: Stub – mockResolvedValue, no verifica args
      // Arrange
      mockRecipesService.findOne.mockResolvedValue({ id: 'r1', user: { id: 'u1' } });
      const ctx = makeContext({ id: 'u1' }, { id: 'r1' });

      // Act
      const result = await guard.canActivate(ctx);

      // Assert
      expect(result).toBe(true);
    });

    it('C3-T2: verifica que findOne se llama con el recipeId', async () => {
      // Test Double: Mock – toHaveBeenCalledWith 'r1' verifica la llamada
      // Arrange
      mockRecipesService.findOne.mockResolvedValue({ id: 'r1', user: { id: 'u1' } });
      const ctx = makeContext({ id: 'u1' }, { id: 'r1' });

      // Act
      await guard.canActivate(ctx);

      // Assert
      expect(mockRecipesService.findOne).toHaveBeenCalledWith('r1');
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C4: Usuario NO es dueño → ForbiddenException
  // ──────────────────────────────────────────────────────────
  describe('C4: Usuario no es dueño', () => {
    it('C4-T1: lanza ForbiddenException si el usuario NO es dueño', async () => {
      // Test Double: Stub – mockResolvedValue retorna receta ajena sin verificar args
      // Arrange
      mockRecipesService.findOne.mockResolvedValue({ id: 'r1', user: { id: 'u2' } });
      const ctx = makeContext({ id: 'u1' }, { id: 'r1' });

      // Act & Assert
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C5: Receta no existe → NotFoundException
  // ──────────────────────────────────────────────────────────
  describe('C5: Receta no encontrada', () => {
    it('C5-T1: lanza NotFoundException si findOne retorna null', async () => {
      // Test Double: Stub – mockResolvedValue null sin verificar args
      // Arrange
      mockRecipesService.findOne.mockResolvedValue(null);
      const ctx = makeContext({ id: 'u1' }, { id: 'r-none' });

      // Act & Assert
      await expect(guard.canActivate(ctx)).rejects.toThrow(NotFoundException);
    });
  });
});
