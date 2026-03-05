import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { AuthGuard } from '../security/auth.guard';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  VER PERFIL BACK – Pruebas por camino (assertion)
//  3 caminos + 1 prueba de fallo
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/* ────────── Datos de prueba ────────── */
const DB_USER = {
  id: '1',
  username: 'testuser',
  password: '$2b$10$hashedpassword123',
  email: 'test@test.com',
  avatar: 'avatar.png',
  bio: 'bio del usuario',
  role: 'user',
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
describe('Ver Perfil Back – Pruebas por camino', () => {

  // ──────────────────────────────────────────────────────────
  //  C1: 1→2→3→5→6→7→8→10→11→FIN
  //  Token válido, usuario existe → 200 OK sin contraseña
  // ──────────────────────────────────────────────────────────
  describe('C1: Usuario existe (200 OK)', () => {

    // Assert: el resultado NO contiene el campo password
    it('C1-T1: retorna usuario sin el campo password', async () => {
      const repo = { findOne: async () => ({ ...DB_USER }) };
      const service = new UserService(repo as any);

      const result = await service.findOne('1');

      expect(result).toBeDefined();
      expect((result as any).password).toBeUndefined();
    });

    // Assert: username y email coinciden con los datos del repositorio
    it('C1-T2: retorna username y email correctos', async () => {
      const repo = { findOne: async () => ({ ...DB_USER }) };
      const service = new UserService(repo as any);

      const result = await service.findOne('1');

      expect((result as any).username).toBe('testuser');
      expect((result as any).email).toBe('test@test.com');
    });

    // Assert: el id del resultado coincide con el solicitado
    it('C1-T3: retorna el id correcto', async () => {
      const repo = { findOne: async () => ({ ...DB_USER }) };
      const service = new UserService(repo as any);

      const result = await service.findOne('1');

      expect((result as any).id).toBe('1');
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C2: 1→2→3→4→FIN
  //  Token inválido → 401 Unauthorized (AuthGuard)
  // ──────────────────────────────────────────────────────────
  describe('C2: Token inválido (401 Unauthorized)', () => {

    // Assert: lanza UnauthorizedException si no existe header Authorization
    it('C2-T1: lanza excepción si no hay header Authorization', () => {
      const jwtStub = { verify: () => ({}) };
      const guard = new AuthGuard(jwtStub as any);
      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({ headers: {} }),
        }),
      } as any;

      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });

    // Assert: lanza UnauthorizedException si el token no puede ser verificado
    it('C2-T2: lanza excepción si el token es inválido', () => {
      const jwtStub = { verify: () => { throw new Error('invalid'); } };
      const guard = new AuthGuard(jwtStub as any);
      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: 'Bearer token-invalido' },
          }),
        }),
      } as any;

      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });

    // Assert: lanza UnauthorizedException si el formato no es "Bearer <token>"
    it('C2-T3: lanza excepción si el formato no es Bearer', () => {
      const jwtStub = { verify: () => ({}) };
      const guard = new AuthGuard(jwtStub as any);
      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: 'Basic abc123' },
          }),
        }),
      } as any;

      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C3: 1→2→3→5→6→7→8→9→FIN
  //  Token válido, usuario no existe → 404 Not Found
  // ──────────────────────────────────────────────────────────
  describe('C3: Usuario no existe (404 Not Found)', () => {

    // Assert: lanza NotFoundException cuando el repositorio retorna null
    it('C3-T1: lanza NotFoundException cuando findOne retorna null', async () => {
      const repo = { findOne: async () => null };
      const service = new UserService(repo as any);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });

    // Assert: también lanza NotFoundException con un id completamente inventado
    it('C3-T2: lanza NotFoundException con id inexistente', async () => {
      const repo = { findOne: async () => null };
      const service = new UserService(repo as any);

      await expect(service.findOne('abc-no-existe')).rejects.toThrow(NotFoundException);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ⛔ PRUEBAS QUE HACEN FALLAR EL CÓDIGO (bugs reales)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('⛔ Fallos esperados (bugs en el código)', () => {

    // BUG: Si la base de datos lanza un error inesperado (connection refused,
    // timeout, etc.), el servicio NO lo captura. El error sube como un 500
    // Internal Server Error genérico en lugar de una HttpException manejada.
    it('⛔ F1: error de BD debería devolver HttpException, no error genérico', async () => {
      const repo = {
        findOne: async () => { throw new Error('Connection refused'); },
      };
      const service = new UserService(repo as any);

      let thrownError: any;
      try {
        await service.findOne('1');
      } catch (e) {
        thrownError = e;
      }

      // Assert: el error debería tener getStatus() porque debería ser HttpException
      // FALLA: es un Error genérico de JS, no tiene getStatus()
      expect(thrownError).toBeDefined();
      expect(typeof thrownError.getStatus).toBe('function');
    });
  });
});
