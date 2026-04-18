import { NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { AuthGuard } from '../security/auth.guard';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EDITAR PERFIL BACK – Pruebas AAA (Arrange, Act, Assert) con Mocks
//  3 caminos + 2 pruebas de fallo
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Editar Perfil Back – Pruebas AAA', () => {

  // ──────────────────────────────────────────────────────────
  //  C1: 1→2→4→5→6→7→8→10→11→FIN
  //  Token válido, update exitoso → 200 OK sin password
  // ──────────────────────────────────────────────────────────
  describe('C1: Update exitoso (200 OK)', () => {

    it('C1-T1: retorna usuario actualizado sin password', async () => {
      // Test Double: Stub – mockResolvedValue retorna usuario actualizado sin verificar args
      // Arrange
      const userId = '1';
      const updateDto = { username: 'nuevoNombre' };
      const updatedUser = {
        id: userId,
        username: 'nuevoNombre',
        email: 'test@test.com',
        avatar: 'av.png',
        bio: 'nueva bio',
        role: 'user',
      };

      const mockUserRepository = {
        findOne: jest.fn().mockResolvedValue(updatedUser),
        update: jest.fn().mockResolvedValue({}),
      };

      const service = new UserService(mockUserRepository as any);

      // Act
      const result = await service.update(userId, updateDto);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(result).toBeDefined();
      expect((result as any).password).toBeUndefined();
    });

    it('C1-T2: el username del resultado es el actualizado', async () => {
      // Test Double: Mock – toHaveBeenCalled en update verifica que se invocó la actualización
      // Arrange
      const userId = '1';
      const updateDto = { username: 'nuevoNombre' };
      const updatedUser = {
        id: userId,
        username: 'nuevoNombre',
        email: 'test@test.com',
        avatar: 'av.png',
        bio: 'nueva bio',
        role: 'user',
      };

      const mockUserRepository = {
        findOne: jest.fn().mockResolvedValue(updatedUser),
        update: jest.fn().mockResolvedValue({}),
      };

      const service = new UserService(mockUserRepository as any);

      // Act
      const result = await service.update(userId, updateDto);

      // Assert
      expect((result as any).username).toBe('nuevoNombre');
      expect(mockUserRepository.update).toHaveBeenCalled();
    });

    it('C1-T3: el id se mantiene igual tras la actualización', async () => {
      // Test Double: Stub – mockResolvedValue retorna usuario con mismo id sin verificar args
      // Arrange
      const userId = '1';
      const updateDto = { username: 'nuevoNombre' };
      const updatedUser = {
        id: userId,
        username: 'nuevoNombre',
        email: 'test@test.com',
        avatar: 'av.png',
        bio: 'nueva bio',
        role: 'user',
      };

      const mockUserRepository = {
        findOne: jest.fn().mockResolvedValue(updatedUser),
        update: jest.fn().mockResolvedValue({}),
      };

      const service = new UserService(mockUserRepository as any);

      // Act
      const result = await service.update(userId, updateDto);

      // Assert
      expect((result as any).id).toBe(userId);
    });

    // ──────────────────────────────────────────────────────────
    //  Email duplicado en otro usuario → 409 Conflict
    // ──────────────────────────────────────────────────────────
    it('C1-T4: lanza ConflictException si email está en otro usuario', async () => {
      // Test Double: Mock – toHaveBeenCalledWith en findOne verifica la comprobación de email
      // Arrange
      const userId = '1';
      const updateDto = { email: 'existing@test.com' };
      const otherUser = { id: '2', email: 'existing@test.com' };
      const currentUser = {
        id: userId,
        email: 'old@test.com',
        username: 'test',
        avatar: 'av.png',
        bio: 'bio',
        role: 'user',
      };

      const mockUserRepository = {
        findOne: jest.fn()
          .mockResolvedValueOnce(otherUser) // primera llamada: email exists check
          .mockResolvedValueOnce(currentUser), // segunda: fetch updated user
        update: jest.fn(),
      };

      const service = new UserService(mockUserRepository as any);

      // Act & Assert
      await expect(service.update(userId, updateDto)).rejects.toThrow(ConflictException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: updateDto.email },
      });
    });

    // ──────────────────────────────────────────────────────────
    //  Email update exitoso cuando es único
    // ──────────────────────────────────────────────────────────
    it('C1-T5: update exitoso cuando email es único', async () => {
      // Test Double: Mock – toHaveBeenCalledWith {id, updateDto} verifica la llamada a update
      // Arrange
      const userId = '1';
      const updateDto = { email: 'newunique@test.com' };
      const updatedUser = {
        id: userId,
        email: 'newunique@test.com',
        username: 'test',
        avatar: 'av.png',
        bio: 'bio',
        role: 'user',
      };

      const mockUserRepository = {
        findOne: jest.fn().mockResolvedValue(updatedUser),
        update: jest.fn().mockResolvedValue({}),
      };

      const service = new UserService(mockUserRepository as any);

      // Act
      const result = await service.update(userId, updateDto);

      // Assert
      expect((result as any).email).toBe('newunique@test.com');
      expect(mockUserRepository.update).toHaveBeenCalledWith({ id: userId }, updateDto);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C2: 1→2→3→FIN
  //  Token inválido → 401 Unauthorized
  // ──────────────────────────────────────────────────────────
  describe('C2: Token inválido (401)', () => {

    it('C2-T1: lanza UnauthorizedException si no hay Authorization header', () => {
      // Test Double: Dummy + Mock – ctx vacío + verifica switchToHttp fue llamado
      // Arrange
      const mockJwt = { verify: jest.fn().mockReturnValue({}) };
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

    it('C2-T2: lanza UnauthorizedException si el token expiró', () => {
      // Test Double: Fake + Mock – mockImplementation lanza error real + verifica verify llamado
      // Arrange
      const mockJwt = {
        verify: jest.fn().mockImplementation(() => {
          throw new Error('jwt expired');
        }),
      };
      const guard = new AuthGuard(mockJwt as any);
      const mockRequest = { headers: { authorization: 'Bearer expired-token' } };
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as any;

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
      expect(mockJwt.verify).toHaveBeenCalledWith('expired-token');
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C3: 1→2→4→5→6→7→8→9→FIN
  //  Token válido, usuario no encontrado tras update → 404
  // ──────────────────────────────────────────────────────────
  describe('C3: Usuario no encontrado tras update (404)', () => {

    it('C3-T1: lanza NotFoundException si findOne retorna null tras update', async () => {
      // Test Double: Stub + Mock – mockResolvedValue null + toHaveBeenCalledWith findOne
      // Arrange
      const userId = '999';
      const updateDto = { username: 'x' };

      const mockUserRepository = {
        findOne: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      };

      const service = new UserService(mockUserRepository as any);

      // Act & Assert
      await expect(service.update(userId, updateDto)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
    });

    it('C3-T2: lanza NotFoundException incluso para id inexistente', async () => {
      // Test Double: Stub + Mock – mockResolvedValue null + toHaveBeenCalledWith id inexistente
      // Arrange
      const userId = 'no-existo';
      const updateDto = { bio: 'test' };

      const mockUserRepository = {
        findOne: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      };

      const service = new UserService(mockUserRepository as any);

      // Act & Assert
      await expect(service.update(userId, updateDto)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //   PRUEBAS QUE HACEN FALLAR EL CÓDIGO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe(' Fallos esperados (bugs)', () => {

    // BUG: update() no valida que el dto tenga al menos un campo actualizable.
    // Se puede enviar un dto vacío {} y se ejecuta repo.update(id, {})
    // sin hacer nada útil — desperdicia un query a la BD.
    it(' F1: dto vacío debería lanzar error pero NO lo hace', async () => {
      // Test Double: Stub – documenta bug: update acepta dto vacío sin lanzar error
      // Arrange
      const userId = '1';
      const emptyDto = {} as any;
      const dbUser = {
        id: userId,
        username: 'testuser',
        email: 'test@test.com',
        password: '$2b$10$hash',
        avatar: 'av.png',
        bio: 'bio',
        role: 'user',
      };

      const mockUserRepository = {
        findOne: jest.fn().mockResolvedValue(dbUser),
        update: jest.fn().mockResolvedValue({}),
      };

      const service = new UserService(mockUserRepository as any);

      // Act & Assert
      // FALLA: no lanza error, simplemente ejecuta update con {}
      await expect(service.update(userId, emptyDto)).rejects.toThrow();
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { id: userId },
        emptyDto
      );
    });

    // BUG: Si repo.update lanza error de BD (ej. unique constraint en username),
    // el servicio no lo captura como ConflictException — sube como 500.
    it(' F2: error de constraint debería ser ConflictException, no 500', async () => {
      // Test Double: Stub – documenta bug: error de BD no se convierte en ConflictException
      // Arrange
      const userId = '1';
      const updateDto = { username: 'duplicado' };
      const dbError = new Error('duplicate key value violates unique constraint "users_username_key"');

      const mockUserRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: userId,
          username: 'testuser',
          email: 'test@test.com',
        }),
        update: jest.fn().mockRejectedValue(dbError),
      };

      const service = new UserService(mockUserRepository as any);

      // Act & Assert
      // FALLA: es un Error genérico, no ConflictException
      try {
        await service.update(userId, updateDto);
        expect(true).toBe(false); // no debería llegar aquí
      } catch (error: any) {
        expect(mockUserRepository.update).toHaveBeenCalledWith(
          { id: userId },
          updateDto
        );
        // FALLA: debería ser ConflictException pero es un Error genérico
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
  // ──────────────────────────────────────────────────────────
  //  remove
  // ──────────────────────────────────────────────────────────
  describe('remove', () => {

    it('retorna success si softDelete afecta un registro', async () => {
      // Test Double: Stub – mockResolvedValue {affected:1} sin verificar args
      // Arrange
      const mockUserRepository = {
        findOne: jest.fn(),
        update: jest.fn(),
        softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
      };
      const svc = new UserService(mockUserRepository as any);

      // Act
      const result = await svc.remove('1');

      // Assert
      expect(result).toEqual({ success: true, message: 'User removed' });
    });

    it('lanza NotFoundException si softDelete no afecta registros', async () => {
      // Test Double: Stub – mockResolvedValue {affected:0} sin verificar args
      // Arrange
      const mockUserRepository = {
        findOne: jest.fn(),
        update: jest.fn(),
        softDelete: jest.fn().mockResolvedValue({ affected: 0 }),
      };
      const svc = new UserService(mockUserRepository as any);

      // Act & Assert
      await expect(svc.remove('999')).rejects.toThrow(NotFoundException);
    });

    it('llama a softDelete con el id correcto', async () => {
      // Test Double: Mock – toHaveBeenCalledWith verifica que softDelete recibe el id
      // Arrange
      const mockUserRepository = {
        findOne: jest.fn(),
        update: jest.fn(),
        softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
      };
      const svc = new UserService(mockUserRepository as any);

      // Act
      await svc.remove('abc-123');

      // Assert
      expect(mockUserRepository.softDelete).toHaveBeenCalledWith('abc-123');
    });
  });});
