import { RecipesService } from '../recipes/recipes.service';
import { NotFoundException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../security/auth.guard';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ELIMINAR COMENTARIO BACK – Pruebas por camino (assertion, sin mocks)
//  4 caminos + 2 pruebas de fallo
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const COMMENT = {
  id: 'c1',
  message: 'Muy buena receta',
  user: { id: 'u1', username: 'chef', email: 'chef@test.com' },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const OTHER_USER = { id: 'u2', username: 'otro', email: 'otro@test.com' };
const OWNER_USER = { id: 'u1', username: 'chef', email: 'chef@test.com' };

describe('Eliminar Comentario Back – Pruebas por camino', () => {

  // ──────────────────────────────────────────────────────────
  //  C1: 1→2→3→4→FIN
  //  Token inválido → AuthGuard lanza 401
  // ──────────────────────────────────────────────────────────
  describe('C1: Token inválido (401)', () => {

    const jwtStub = {
      verify: () => { throw new Error('jwt malformed'); },
    };

    it('C1-T1: lanza UnauthorizedException si no hay header Authorization', () => {
      const guard = new AuthGuard(jwtStub as any);
      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({ headers: {} }),
        }),
      } as any;

      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });

    it('C1-T2: lanza UnauthorizedException con token mal formado', () => {
      const guard = new AuthGuard(jwtStub as any);
      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({ headers: { authorization: 'Bearer token-invalido' } }),
        }),
      } as any;

      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C2: 1→2→3→5→6→7→8→9→FIN
  //  Token válido, commentId no existe → 404
  // ──────────────────────────────────────────────────────────
  describe('C2: Comentario no encontrado (404)', () => {

    function makeService(commentExists: boolean) {
      const commentRepo = {
        findOne: async () => commentExists ? COMMENT : null,
        remove: async () => {},
      };
      const recipeRepo = { findOne: async () => null };
      return new RecipesService(recipeRepo as any, commentRepo as any);
    }

    it('C2-T1: lanza NotFoundException si commentId no existe', async () => {
      const svc = makeService(false);
      await expect(svc.removeComment('id-inexistente', OWNER_USER as any))
        .rejects
        .toThrow(NotFoundException);
    });

    it('C2-T2: el mensaje de error contiene el ID del comentario', async () => {
      const svc = makeService(false);
      try {
        await svc.removeComment('id-inexistente', OWNER_USER as any);
        fail('debió lanzar NotFoundException');
      } catch (e: any) {
        expect(e.message).toContain('id-inexistente');
      }
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C3: 1→2→3→5→6→7→8→10→11→FIN
  //  Token válido, comentario existe, pero NO es el autor → 403
  // ──────────────────────────────────────────────────────────
  describe('C3: No es el autor del comentario (403)', () => {

    function makeService() {
      const commentRepo = {
        findOne: async () => ({ ...COMMENT }),
        remove: async () => {},
      };
      const recipeRepo = { findOne: async () => null };
      return new RecipesService(recipeRepo as any, commentRepo as any);
    }

    it('C3-T1: lanza ForbiddenException si el usuario no es el dueño', async () => {
      const svc = makeService();
      await expect(svc.removeComment('c1', OTHER_USER as any))
        .rejects
        .toThrow(ForbiddenException);
    });

    it('C3-T2: el mensaje indica que solo puedes eliminar tus propios comentarios', async () => {
      const svc = makeService();
      try {
        await svc.removeComment('c1', OTHER_USER as any);
        fail('debió lanzar ForbiddenException');
      } catch (e: any) {
        expect(e.message).toContain('your own comments');
      }
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C4: 1→2→3→5→6→7→8→10→12→13→FIN
  //  Token válido, comentario existe, es el autor → 204 (remove)
  // ──────────────────────────────────────────────────────────
  describe('C4: Eliminación exitosa (204)', () => {

    let removedComment: any = null;

    function makeService() {
      removedComment = null;
      const commentRepo = {
        findOne: async () => ({ ...COMMENT }),
        remove: async (c: any) => { removedComment = c; },
      };
      const recipeRepo = { findOne: async () => null };
      return new RecipesService(recipeRepo as any, commentRepo as any);
    }

    it('C4-T1: no lanza ninguna excepción', async () => {
      const svc = makeService();
      await expect(svc.removeComment('c1', OWNER_USER as any))
        .resolves
        .toBeUndefined();
    });

    it('C4-T2: se invoca remove con el comentario correcto', async () => {
      const svc = makeService();
      await svc.removeComment('c1', OWNER_USER as any);

      expect(removedComment).not.toBeNull();
      expect(removedComment.id).toBe('c1');
    });

    it('C4-T3: la función retorna void (sin contenido)', async () => {
      const svc = makeService();
      const result = await svc.removeComment('c1', OWNER_USER as any);
      expect(result).toBeUndefined();
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
      let hardDeleted = false;
      let softDeleted = false;

      const commentRepo = {
        findOne: async () => ({ ...COMMENT }),
        remove: async () => { hardDeleted = true; },
        softRemove: async () => { softDeleted = true; },
      };
      const recipeRepo = { findOne: async () => null };
      const svc = new RecipesService(recipeRepo as any, commentRepo as any);

      await svc.removeComment('c1', OWNER_USER as any);

      // FALLA: se espera soft-delete pero se usa hard-delete
      expect(softDeleted).toBe(true);
      expect(hardDeleted).toBe(false);
    });

    // BUG: Si commentRepository.remove() lanza un error de BD (ej: constraint),
    // no se captura y se propaga como 500 Internal Server Error genérico.
    it('⛔ F2: error de BD al eliminar devuelve 500 genérico en vez de excepción controlada', async () => {
      const commentRepo = {
        findOne: async () => ({ ...COMMENT }),
        remove: async () => { throw new Error('FOREIGN KEY constraint failed'); },
      };
      const recipeRepo = { findOne: async () => null };
      const svc = new RecipesService(recipeRepo as any, commentRepo as any);

      try {
        await svc.removeComment('c1', OWNER_USER as any);
        fail('debió lanzar');
      } catch (e: any) {
        // FALLA: el error no es HttpException, es un Error genérico → 500
        expect(e.status).toBeDefined();
        expect(e.status).toBe(409);
      }
    });
  });
});
