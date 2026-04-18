import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { AuthGuard } from '../security/auth.guard';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  VER PERFIL BACK – Pruebas por camino (AAA + jest.fn mocks)
//  3 caminos + 1 prueba de fallo
//
//  Servicio:   UserService.findOne(id)
//  Guard:      AuthGuard.canActivate(ctx)
//  Endpoint:   GET /user/:id (protegido por AuthGuard)
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

  let service: UserService;
  let mockUserRepo: { findOne: jest.Mock; find: jest.Mock; update: jest.Mock; create: jest.Mock; save: jest.Mock; softDelete: jest.Mock };

  beforeEach(() => {
    mockUserRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };
    service = new UserService(mockUserRepo as any);
  });

  // ──────────────────────────────────────────────────────────
  //  C1: 1→2→3→5→6→7→8→10→11→FIN
  //  Token válido, usuario existe → 200 OK sin contraseña
  // ──────────────────────────────────────────────────────────
  describe('C1: Usuario existe (200 OK)', () => {

    it('C1-T1: retorna usuario sin el campo password', async () => {
      // Test Double: Stub – mockResolvedValue retorna usuario sin verificar args
      // Arrange
      mockUserRepo.findOne.mockResolvedValue({ ...DB_USER });

      // Act
      const result = await service.findOne('1');

      // Assert
      expect(result).toBeDefined();
      expect((result as any).password).toBeUndefined();
    });

    it('C1-T2: retorna username y email correctos', async () => {
      // Test Double: Stub – mockResolvedValue retorna usuario sin verificar args
      // Arrange
      mockUserRepo.findOne.mockResolvedValue({ ...DB_USER });

      // Act
      const result = await service.findOne('1');

      // Assert
      expect((result as any).username).toBe('testuser');
      expect((result as any).email).toBe('test@test.com');
    });

    it('C1-T3: retorna el id correcto', async () => {
      // Test Double: Stub – mockResolvedValue retorna usuario sin verificar args
      // Arrange
      mockUserRepo.findOne.mockResolvedValue({ ...DB_USER });

      // Act
      const result = await service.findOne('1');

      // Assert
      expect((result as any).id).toBe('1');
    });

    it('C1-T4: llama a userRepo.findOne con el id correcto', async () => {
      // Test Double: Mock – toHaveBeenCalledWith verifica la llamada al repositorio
      // Arrange
      mockUserRepo.findOne.mockResolvedValue({ ...DB_USER });

      // Act
      await service.findOne('1');

      // Assert
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('C1-T5: retorna avatar y bio del usuario', async () => {
      // Test Double: Stub – mockResolvedValue retorna usuario sin verificar args
      // Arrange
      mockUserRepo.findOne.mockResolvedValue({ ...DB_USER });

      // Act
      const result = await service.findOne('1');

      // Assert
      expect((result as any).avatar).toBe('avatar.png');
      expect((result as any).bio).toBe('bio del usuario');
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C2: 1→2→3→4→FIN
  //  Token inválido → 401 Unauthorized (AuthGuard)
  // ──────────────────────────────────────────────────────────
  describe('C2: Token inválido (401 Unauthorized)', () => {

    let mockJwt: { verify: jest.Mock };

    beforeEach(() => {
      mockJwt = { verify: jest.fn() };
    });

    it('C2-T1: lanza excepción si no hay header Authorization', () => {
      // Test Double: Dummy – ctx con headers vacíos, objeto sin comportamiento esperado
      // Arrange
      const guard = new AuthGuard(mockJwt as any);
      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({ headers: {} }),
        }),
      } as any;

      // Act & Assert
      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });

    it('C2-T2: lanza excepción si el token es inválido', () => {
      // Test Double: Fake – mockImplementation que lanza error real
      // Arrange
      mockJwt.verify.mockImplementation(() => { throw new Error('invalid'); });
      const guard = new AuthGuard(mockJwt as any);
      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: 'Bearer token-invalido' },
          }),
        }),
      } as any;

      // Act & Assert
      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });

    it('C2-T3: lanza excepción si el formato no es Bearer', () => {
      // Test Double: Dummy – headers con formato incorrecto, sin comportamiento esperado
      // Arrange
      const guard = new AuthGuard(mockJwt as any);
      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: 'Basic abc123' },
          }),
        }),
      } as any;

      // Act & Assert
      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });

    it('C2-T4: no llama a jwt.verify si no hay header Authorization', () => {
      // Test Double: Mock – not.toHaveBeenCalled verifica que verify no es invocado
      // Arrange
      const guard = new AuthGuard(mockJwt as any);
      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({ headers: {} }),
        }),
      } as any;

      // Act
      try { guard.canActivate(ctx); } catch {}

      // Assert
      expect(mockJwt.verify).not.toHaveBeenCalled();
    });

    it('C2-T5: lanza excepción si el token no tiene id (sub)', () => {
      // Test Double: Stub – mockReturnValue sin sub, sin verificar args
      // Arrange
      mockJwt.verify.mockReturnValue({ username: 'test', email: 'a@b.com' });
      const guard = new AuthGuard(mockJwt as any);
      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: 'Bearer valid-token' },
          }),
        }),
      } as any;

      // Act & Assert
      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C3: 1→2→3→5→6→7→8→9→FIN
  //  Token válido, usuario no existe → 404 Not Found
  // ──────────────────────────────────────────────────────────
  describe('C3: Usuario no existe (404 Not Found)', () => {

    it('C3-T1: lanza NotFoundException cuando findOne retorna null', async () => {
      // Test Double: Stub – mockResolvedValue null sin verificar args
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });

    it('C3-T2: lanza NotFoundException con id inexistente', async () => {
      // Test Double: Stub – mockResolvedValue null sin verificar args
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);

      // Act & Assert
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
      // Test Double: Stub – mockRejectedValue pre-programa error de BD sin verificar args
      // Arrange
      mockUserRepo.findOne.mockRejectedValue(new Error('Connection refused'));

      // Act
      let thrownError: any;
      try {
        await service.findOne('1');
      } catch (e) {
        thrownError = e;
      }

      // Assert — FALLA: es un Error genérico de JS, no tiene getStatus()
      expect(thrownError).toBeDefined();
      expect(typeof thrownError.getStatus).toBe('function');
    });
  });

  // ──────────────────────────────────────────────────────────
  //  findByEmail
  // ──────────────────────────────────────────────────────────
  describe('findByEmail', () => {

    it('retorna usuario si el email existe', async () => {
      // Test Double: Stub – mockResolvedValue retorna usuario sin verificar args
      // Arrange
      mockUserRepo.findOne.mockResolvedValue({ ...DB_USER });

      // Act
      const result = await service.findByEmail('test@test.com');

      // Assert
      expect(result).toBeDefined();
      expect(result!.email).toBe('test@test.com');
    });

    it('llama a findOne con where y select correctos', async () => {
      // Test Double: Mock – toHaveBeenCalledWith verifica where y select en la llamada
      // Arrange
      mockUserRepo.findOne.mockResolvedValue({ ...DB_USER });

      // Act
      await service.findByEmail('test@test.com');

      // Assert
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
        select: ['id', 'username', 'password', 'email', 'avatar'],
      });
    });

    it('retorna null si el email no existe', async () => {
      // Test Double: Stub – mockResolvedValue null sin verificar args
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findByEmail('no@existe.com');

      // Assert
      expect(result).toBeNull();
    });
  });
});
