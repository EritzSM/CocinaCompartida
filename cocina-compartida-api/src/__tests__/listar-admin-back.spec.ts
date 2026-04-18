import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { UserController } from '../user/user.controller';
import { RoleGuard } from '../security/role.guard';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  LISTAR (ADMIN) BACK – Pruebas por camino (AAA + jest.fn mocks)
//
//  Funcionalidad: GET /users — solo accesible por admin (RoleGuard)
//  Servicio: UserService.findAll()
//  Controlador: UserController.findAll()
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DB_USER = {
  id: '1',
  username: 'testuser',
  password: '$2b$10$hashedpassword123',
  email: 'test@test.com',
  avatar: 'avatar.png',
  bio: 'bio',
  role: 'user',
};

describe('Listar (Admin) Back – Pruebas por camino', () => {
  let service: UserService;
  let mockRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    softDelete: jest.Mock;
  };

  beforeEach(() => {
    mockRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };
    service = new UserService(mockRepo as any);
  });

  // ──────────────────────────────────────────────────────────
  //  C1: Admin autenticado → lista todos los usuarios (200 OK)
  // ──────────────────────────────────────────────────────────
  describe('C1: Admin lista usuarios exitosamente (200 OK)', () => {

    it('C1-T1: retorna lista de usuarios sin password', async () => {
      // Test Double: Stub – mockResolvedValue retorna lista pre-configurada sin verificar args
      // Arrange
      mockRepo.find.mockResolvedValue([{ ...DB_USER }, { ...DB_USER, id: '2', username: 'user2' }]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toHaveLength(2);
      result.forEach((u: any) => {
        expect(u.password).toBeUndefined();
      });
    });

    it('C1-T2: retorna array vacío si no hay usuarios registrados', async () => {
      // Test Double: Stub – mockResolvedValue retorna array vacío sin verificar args
      // Arrange
      mockRepo.find.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([]);
    });

    it('C1-T3: retorna id, username, email, avatar, bio y role de cada usuario', async () => {
      // Test Double: Stub – mockResolvedValue retorna usuario completo sin verificar args
      // Arrange
      mockRepo.find.mockResolvedValue([{ ...DB_USER }]);

      // Act
      const result = await service.findAll();

      // Assert
      const u = result[0] as any;
      expect(u.id).toBe('1');
      expect(u.username).toBe('testuser');
      expect(u.email).toBe('test@test.com');
      expect(u.avatar).toBe('avatar.png');
      expect(u.bio).toBe('bio');
      expect(u.role).toBe('user');
    });

    it('C1-T4: llama a userRepo.find sin filtros (devuelve todos)', async () => {
      // Test Double: Mock – toHaveBeenCalledTimes + toHaveBeenCalledWith verifica la llamada
      // Arrange
      mockRepo.find.mockResolvedValue([{ ...DB_USER }]);

      // Act
      await service.findAll();

      // Assert
      expect(mockRepo.find).toHaveBeenCalledTimes(1);
      expect(mockRepo.find).toHaveBeenCalledWith();
    });

    it('C1-T5: el controlador delega al servicio', async () => {
      // Test Double: Mock – mockService + toHaveBeenCalled verifica la delegación
      // Arrange
      const mockService = { findAll: jest.fn().mockResolvedValue([{ id: '1', username: 'admin' }]) };
      const controller = new UserController(mockService as any);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(mockService.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('C1-T6: la contraseña no aparece en ningún usuario de la lista', async () => {
      // Test Double: Stub – mockResolvedValue retorna usuarios con password sin verificar args
      // Arrange
      const users = [
        { ...DB_USER, id: '1' },
        { ...DB_USER, id: '2', username: 'user2', password: '$2b$10$otrohash' },
        { ...DB_USER, id: '3', username: 'user3', password: '$2b$10$otrohash2' },
      ];
      mockRepo.find.mockResolvedValue(users);

      // Act
      const result = await service.findAll();

      // Assert
      result.forEach((u: any) => expect(u.password).toBeUndefined());
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C2: Usuario sin permisos de admin → 403 Forbidden (RoleGuard)
  // ──────────────────────────────────────────────────────────
  describe('C2: Usuario no autorizado (403 Forbidden)', () => {

    it('C2-T1: RoleGuard lanza ForbiddenException si no hay token', async () => {
      // Test Double: Stub – context con header mock vacío sin verificar args
      // Arrange
      const mockJwt = { verify: jest.fn() };
      const mockRecipesService = { findOne: jest.fn() };
      const guard = new RoleGuard(mockJwt as any, mockRecipesService as any);
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {},
            params: {},
            body: {},
            header: jest.fn().mockReturnValue(undefined),
          }),
        }),
      } as any;

      // Act & Assert
      await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });

    it('C2-T2: RoleGuard lanza ForbiddenException si el userId del token no coincide con body.userId', async () => {
      // Test Double: Stub – mockReturnValue con userId diferente sin verificar args
      // Arrange
      const mockJwt = { verify: jest.fn().mockReturnValue({ id: 'u1' }) };
      const mockRecipesService = { findOne: jest.fn() };
      const guard = new RoleGuard(mockJwt as any, mockRecipesService as any);
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: { authorization: 'Bearer valid-token' },
            params: {},
            body: { userId: 'u99' }, // diferente al del token
            header: jest.fn().mockReturnValue('Bearer valid-token'),
          }),
        }),
      } as any;

      // Act & Assert
      await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });
  });

  //  PRUEBAS QUE HACEN FALLAR EL CÓDIGO (bugs reales)
  
  describe('Fallos esperados (bugs)', () => {

    // BUG: No existe verificación de rol "admin" real en el sistema.
    // RoleGuard verifica que el userId del token coincida con body.userId,
    // pero NO verifica que el usuario tenga role === 'admin'.
    // Un usuario normal que conozca su propio userId podría acceder.
    it('F1: RoleGuard no valida que el usuario sea admin — cualquier usuario autenticado podría pasar', async () => {
      // Test Double: Stub – documenta bug: guard no valida rol admin
      // Arrange
      const mockJwt = { verify: jest.fn().mockReturnValue({ id: 'u1', role: 'user' }) }; // rol user, NO admin
      const mockRecipesService = { findOne: jest.fn() };
      const guard = new RoleGuard(mockJwt as any, mockRecipesService as any);
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: { authorization: 'Bearer valid-token' },
            params: {},
            body: { userId: 'u1' }, // coincide con el del token → pasa el guard
            header: jest.fn().mockReturnValue('Bearer valid-token'),
          }),
        }),
      } as any;

      // Act
      const result = await guard.canActivate(mockContext);

      // Assert — FALLA: debería rechazar si role !== 'admin', pero permite pasar
      expect(result).toBe(true); // esto documenta el bug: un user normal pasa el guard
    });

    // BUG: Si la base de datos falla al listar usuarios (ej: connection timeout),
    // el servicio no captura el error y sale como 500 genérico.
    it('F2: error de BD en findAll no se convierte en HttpException controlada', async () => {
      // Test Double: Stub – mockRejectedValue pre-programa error de BD sin verificar args
      // Arrange
      mockRepo.find.mockRejectedValue(new Error('Connection timeout'));

      // Act
      let thrownError: any;
      try {
        await service.findAll();
      } catch (e) {
        thrownError = e;
      }

      // Assert — BUG documentado: es Error genérico, no tiene getStatus()
      expect(thrownError).toBeDefined();
      expect(typeof thrownError.getStatus).toBe('undefined');
    });
  });
});
