import { NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { AuthGuard } from '../security/auth.guard';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EDITAR PERFIL BACK – Pruebas por camino (assertion, sin mocks)
//  3 caminos + 2 pruebas de fallo
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DB_USER = {
  id: '1', username: 'testuser', password: '$2b$10$hash',
  email: 'test@test.com', avatar: 'av.png', bio: 'bio', role: 'user',
};

const UPDATED_USER = {
  id: '1', username: 'nuevoNombre', password: '$2b$10$hash',
  email: 'test@test.com', avatar: 'av.png', bio: 'nueva bio', role: 'user',
};

describe('Editar Perfil Back – Pruebas por camino', () => {

  // ──────────────────────────────────────────────────────────
  //  C1: 1→2→4→5→6→7→8→10→11→FIN
  //  Token válido, update exitoso → 200 OK sin password
  // ──────────────────────────────────────────────────────────
  describe('C1: Update exitoso (200 OK)', () => {

    it('C1-T1: retorna usuario actualizado sin password', async () => {
      const repo = {
        findOne: async () => ({ ...UPDATED_USER }),
        update: async () => ({}),
      };
      const service = new UserService(repo as any);
      const result = await service.update('1', { username: 'nuevoNombre' });

      expect(result).toBeDefined();
      expect((result as any).password).toBeUndefined();
    });

    it('C1-T2: el username del resultado es el actualizado', async () => {
      const repo = {
        findOne: async () => ({ ...UPDATED_USER }),
        update: async () => ({}),
      };
      const service = new UserService(repo as any);
      const result = await service.update('1', { username: 'nuevoNombre' });

      expect((result as any).username).toBe('nuevoNombre');
    });

    it('C1-T3: el id se mantiene igual tras la actualización', async () => {
      const repo = {
        findOne: async () => ({ ...UPDATED_USER }),
        update: async () => ({}),
      };
      const service = new UserService(repo as any);
      const result = await service.update('1', { username: 'nuevoNombre' });

      expect((result as any).id).toBe('1');
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C2: 1→2→3→FIN
  //  Token inválido → 401 Unauthorized
  // ──────────────────────────────────────────────────────────
  describe('C2: Token inválido (401)', () => {

    it('C2-T1: lanza UnauthorizedException si no hay Authorization header', () => {
      const guard = new AuthGuard({ verify: () => ({}) } as any);
      const ctx = {
        switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }),
      } as any;

      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });

    it('C2-T2: lanza UnauthorizedException si el token expiró', () => {
      const guard = new AuthGuard({
        verify: () => { throw new Error('jwt expired'); },
      } as any);
      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({ headers: { authorization: 'Bearer expired-token' } }),
        }),
      } as any;

      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C3: 1→2→4→5→6→7→8→9→FIN
  //  Token válido, usuario no encontrado tras update → 404
  // ──────────────────────────────────────────────────────────
  describe('C3: Usuario no encontrado tras update (404)', () => {

    it('C3-T1: lanza NotFoundException si findOne retorna null tras update', async () => {
      const repo = {
        findOne: async () => null,
        update: async () => ({}),
      };
      const service = new UserService(repo as any);

      await expect(service.update('999', { username: 'x' })).rejects.toThrow(NotFoundException);
    });

    it('C3-T2: lanza NotFoundException incluso para id inexistente', async () => {
      const repo = {
        findOne: async () => null,
        update: async () => ({}),
      };
      const service = new UserService(repo as any);

      await expect(service.update('no-existo', { bio: 'test' })).rejects.toThrow(NotFoundException);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ⛔ PRUEBAS QUE HACEN FALLAR EL CÓDIGO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('⛔ Fallos esperados (bugs)', () => {

    // BUG: update() no valida que el dto tenga al menos un campo actualizable.
    // Se puede enviar un dto vacío {} y se ejecuta repo.update(id, {})
    // sin hacer nada útil — desperdicia un query a la BD.
    it('⛔ F1: dto vacío debería lanzar error pero NO lo hace', async () => {
      const repo = {
        findOne: async () => ({ ...DB_USER }),
        update: async () => ({}),
      };
      const service = new UserService(repo as any);

      let threw = false;
      try {
        await service.update('1', {} as any);
      } catch {
        threw = true;
      }

      // FALLA: no lanza error, simplemente ejecuta update con {}
      expect(threw).toBe(true);
    });

    // BUG: Si repo.update lanza error de BD (ej. unique constraint en username),
    // el servicio no lo captura como ConflictException — sube como 500.
    it('⛔ F2: error de constraint debería ser ConflictException, no 500', async () => {
      const repo = {
        findOne: async () => null,
        update: async () => { throw new Error('duplicate key value violates unique constraint'); },
      };
      const service = new UserService(repo as any);

      let thrownError: any;
      try {
        await service.update('1', { username: 'duplicado' });
      } catch (e) {
        thrownError = e;
      }

      // FALLA: es un Error genérico, no ConflictException
      expect(thrownError).toBeDefined();
      expect(typeof thrownError.getStatus).toBe('function');
    });
  });
});
