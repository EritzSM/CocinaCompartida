import { RecipesService } from '../recipes/recipes.service';
import { NotFoundException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../security/auth.guard';

//  ELIMINAR COMENTARIO BACK – Pruebas AAA (Arrange, Act, Assert) con Mocks
//  4 caminos + 2 pruebas de fallo

describe('Eliminar Comentario Back – Pruebas por camino', () => {


  //  C1: 1→2→3→4→FIN
  //  Token inválido → AuthGuard lanza 401

  describe('C1: Token inválido (401)', () => {

    it('C1-T1: lanza UnauthorizedException si no hay header Authorization', () => {
      // Test Double: Mock – verifica mockContext.switchToHttp fue llamado
      // Arrange
      const mockJwt = { verify: jest.fn() };
      const guard = new AuthGuard(mockJwt as any);
      const mockRequest = { headers: {} };
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as any;

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
      expect(mockContext.switchToHttp).toHaveBeenCalled();
    });

    it('C1-T2: lanza UnauthorizedException con token mal formado', () => {
      // Test Double: Fake + Mock – mockImplementation lanza error real + toHaveBeenCalledWith
      // Arrange
      const mockJwt = {
        verify: jest.fn().mockImplementation(() => {
          throw new Error('jwt malformed');
        }),
      };
      const guard = new AuthGuard(mockJwt as any);
      const mockRequest = { headers: { authorization: 'Bearer token-invalido' } };
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as any;

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
      expect(mockJwt.verify).toHaveBeenCalledWith('token-invalido');
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C2: 1→2→3→5→6→7→8→9→FIN
  //  Token válido, commentId no existe → 404
  // ──────────────────────────────────────────────────────────
  describe('C2: Comentario no encontrado (404)', () => {

    it('C2-T1: lanza NotFoundException si commentId no existe', async () => {
      // Test Double: Mock – toHaveBeenCalledWith en findOne verifica la llamada
      // Arrange
      const mockCommentRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        remove: jest.fn(),
      };
      const mockRecipeRepo = { findOne: jest.fn() };
      const service = new RecipesService(mockRecipeRepo as any, mockCommentRepo as any);
      const ownerUser = { id: 'u1', username: 'chef', email: 'chef@test.com' };

      // Act & Assert
      await expect(service.removeComment('id-inexistente', ownerUser as any))
        .rejects.toThrow(NotFoundException);
      expect(mockCommentRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'id-inexistente' },
        relations: ['user'],
      });
    });

    it('C2-T2: el mensaje de error contiene el ID del comentario', async () => {
      // Test Double: Stub – mockResolvedValue null sin verificar args
      // Arrange
      const mockCommentRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        remove: jest.fn(),
      };
      const mockRecipeRepo = { findOne: jest.fn() };
      const service = new RecipesService(mockRecipeRepo as any, mockCommentRepo as any);
      const ownerUser = { id: 'u1', username: 'chef', email: 'chef@test.com' };

      // Act
      let errorMessage = '';
      try {
        await service.removeComment('id-inexistente', ownerUser as any);
      } catch (e: any) {
        errorMessage = e.message;
      }

      // Assert
      expect(errorMessage).toContain('id-inexistente');
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C3: 1→2→3→5→6→7→8→10→11→FIN
  //  Token válido, comentario existe, pero NO es el autor → 403
  // ──────────────────────────────────────────────────────────
  describe('C3: No es el autor del comentario (403)', () => {

    it('C3-T1: lanza ForbiddenException si el usuario no es el dueño', async () => {
      // Test Double: Mock – not.toHaveBeenCalled en remove verifica que no se eliminó
      // Arrange
      const comment = {
        id: 'c1',
        message: 'Muy buena receta',
        user: { id: 'u1', username: 'chef', email: 'chef@test.com' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockCommentRepo = {
        findOne: jest.fn().mockResolvedValue(comment),
        remove: jest.fn(),
      };
      const mockRecipeRepo = { findOne: jest.fn() };
      const service = new RecipesService(mockRecipeRepo as any, mockCommentRepo as any);
      const otherUser = { id: 'u2', username: 'otro', email: 'otro@test.com' };

      // Act & Assert
      await expect(service.removeComment('c1', otherUser as any))
        .rejects.toThrow(ForbiddenException);
      expect(mockCommentRepo.remove).not.toHaveBeenCalled();
    });

    it('C3-T2: el mensaje indica que solo puedes eliminar tus propios comentarios', async () => {
      // Test Double: Stub – mockResolvedValue retorna comentario ajeno sin verificar args
      // Arrange
      const comment = {
        id: 'c1',
        message: 'Muy buena receta',
        user: { id: 'u1', username: 'chef', email: 'chef@test.com' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockCommentRepo = {
        findOne: jest.fn().mockResolvedValue(comment),
        remove: jest.fn(),
      };
      const mockRecipeRepo = { findOne: jest.fn() };
      const service = new RecipesService(mockRecipeRepo as any, mockCommentRepo as any);
      const otherUser = { id: 'u2', username: 'otro', email: 'otro@test.com' };

      // Act
      let errorMessage = '';
      try {
        await service.removeComment('c1', otherUser as any);
      } catch (e: any) {
        errorMessage = e.message;
      }

      // Assert
      expect(errorMessage).toContain('your own comments');
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C4: 1→2→3→5→6→7→8→10→12→13→FIN
  //  Token válido, comentario existe, es el autor → 204 (remove)
  // ──────────────────────────────────────────────────────────
  describe('C4: Eliminación exitosa (204)', () => {

    it('C4-T1: no lanza ninguna excepción', async () => {
      // Test Double: Stub – mockResolvedValue retorna undefined sin verificar args
      // Arrange
      const comment = {
        id: 'c1',
        message: 'Muy buena receta',
        user: { id: 'u1', username: 'chef', email: 'chef@test.com' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockCommentRepo = {
        findOne: jest.fn().mockResolvedValue(comment),
        remove: jest.fn().mockResolvedValue(undefined),
        softRemove: jest.fn().mockResolvedValue(undefined),
      };
      const mockRecipeRepo = { findOne: jest.fn() };
      const service = new RecipesService(mockRecipeRepo as any, mockCommentRepo as any);
      const ownerUser = { id: 'u1', username: 'chef', email: 'chef@test.com' };

      // Act & Assert
      await expect(service.removeComment('c1', ownerUser as any))
        .resolves.toBeUndefined();
    });

    it('C4-T2: se invoca softRemove con el comentario correcto', async () => {
      // Test Double: Mock – toHaveBeenCalledWith verifica softRemove con el objeto comentario
      // Arrange
      const comment = {
        id: 'c1',
        message: 'Muy buena receta',
        user: { id: 'u1', username: 'chef', email: 'chef@test.com' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockCommentRepo = {
        findOne: jest.fn().mockResolvedValue(comment),
        remove: jest.fn().mockResolvedValue(undefined),
        softRemove: jest.fn().mockResolvedValue(undefined),
      };
      const mockRecipeRepo = { findOne: jest.fn() };
      const service = new RecipesService(mockRecipeRepo as any, mockCommentRepo as any);
      const ownerUser = { id: 'u1', username: 'chef', email: 'chef@test.com' };

      // Act
      await service.removeComment('c1', ownerUser as any);

      // Assert
      expect(mockCommentRepo.softRemove).toHaveBeenCalledTimes(1);
      expect(mockCommentRepo.softRemove).toHaveBeenCalledWith(comment);
    });

    it('C4-T3: la función retorna void (sin contenido)', async () => {
      // Test Double: Stub – mockResolvedValue undefined sin verificar args
      // Arrange
      const comment = {
        id: 'c1',
        message: 'Muy buena receta',
        user: { id: 'u1', username: 'chef', email: 'chef@test.com' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockCommentRepo = {
        findOne: jest.fn().mockResolvedValue(comment),
        remove: jest.fn().mockResolvedValue(undefined),
        softRemove: jest.fn().mockResolvedValue(undefined),
      };
      const mockRecipeRepo = { findOne: jest.fn() };
      const service = new RecipesService(mockRecipeRepo as any, mockCommentRepo as any);
      const ownerUser = { id: 'u1', username: 'chef', email: 'chef@test.com' };

      // Act
      const result = await service.removeComment('c1', ownerUser as any);

      // Assert
      expect(result).toBeUndefined();
    });

    // ──────────────────────────────────────────────────────────
    //  C4-T4: findOne se llama con relations ['user']
    //  (Cubre la rama de relaciones en el query)
    // ──────────────────────────────────────────────────────────
    it('C4-T4: findOne incluye la relación user', async () => {
      // Test Double: Mock – toHaveBeenCalledWith verifica relations en la llamada a findOne
      // Arrange
      const comment = {
        id: 'c1',
        message: 'Muy buena receta',
        user: { id: 'u1', username: 'chef', email: 'chef@test.com' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockCommentRepo = {
        findOne: jest.fn().mockResolvedValue(comment),
        remove: jest.fn().mockResolvedValue(undefined),
        softRemove: jest.fn().mockResolvedValue(undefined),
      };
      const mockRecipeRepo = { findOne: jest.fn() };
      const service = new RecipesService(mockRecipeRepo as any, mockCommentRepo as any);
      const ownerUser = { id: 'u1', username: 'chef', email: 'chef@test.com' };

      // Act
      await service.removeComment('c1', ownerUser as any);

      // Assert
      expect(mockCommentRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'c1' },
        relations: ['user'],
      });
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ⛔ PRUEBAS QUE HACEN FALLAR EL CÓDIGO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('⛔ Fallos esperados (bugs)', () => {

    // BUG: removeComment usa commentRepository.remove() que es DELETE permanente.
    // No hay soft-delete. Si se quiere auditoría o recuperación, no hay forma.
    // Se espera que NO se borre realmente (soft delete), pero sí se borra.
    it('⛔ F1: usa hard-delete en vez de soft-delete — el comentario desaparece para siempre', async () => {
      // Test Double: Mock – verifica softRemove called + remove not.toHaveBeenCalled
      // Arrange
      const comment = {
        id: 'c1',
        message: 'Muy buena receta',
        user: { id: 'u1', username: 'chef', email: 'chef@test.com' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockCommentRepo = {
        findOne: jest.fn().mockResolvedValue(comment),
        remove: jest.fn().mockResolvedValue(undefined),
        softRemove: jest.fn().mockResolvedValue(undefined),
      };
      const mockRecipeRepo = { findOne: jest.fn() };
      const service = new RecipesService(mockRecipeRepo as any, mockCommentRepo as any);
      const ownerUser = { id: 'u1', username: 'chef', email: 'chef@test.com' };

      // Act
      await service.removeComment('c1', ownerUser as any);

      // Assert
      // FALLA: se espera soft-delete pero se usa hard-delete
      expect(mockCommentRepo.softRemove).toHaveBeenCalled();
      expect(mockCommentRepo.remove).not.toHaveBeenCalled();
    });

    // BUG: Si commentRepository.remove() lanza un error de BD (ej: constraint),
    // no se captura y se propaga como 500 Internal Server Error genérico.
    it('⛔ F2: error de BD al eliminar devuelve 500 genérico en vez de excepción controlada', async () => {
      // Test Double: Stub – mockRejectedValue pre-programa error de BD sin verificar args
      // Arrange
      const comment = {
        id: 'c1',
        message: 'Muy buena receta',
        user: { id: 'u1', username: 'chef', email: 'chef@test.com' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const dbError = new Error('FOREIGN KEY constraint failed');
      const mockCommentRepo = {
        findOne: jest.fn().mockResolvedValue(comment),
        softRemove: jest.fn().mockRejectedValue(dbError),
      };
      const mockRecipeRepo = { findOne: jest.fn() };
      const service = new RecipesService(mockRecipeRepo as any, mockCommentRepo as any);
      const ownerUser = { id: 'u1', username: 'chef', email: 'chef@test.com' };

      // Act & Assert
      // FALLA: el error no es HttpException, es un Error genérico → 500
      try {
        await service.removeComment('c1', ownerUser as any);
        expect(true).toBe(false); // no debería llegar aquí
      } catch (e: any) {
        expect(e.status).toBeDefined();
        expect(e.status).toBe(409);
      }
    });
  });
});
