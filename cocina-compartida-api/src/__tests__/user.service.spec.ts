import { UserService } from '../user/user.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock de bcrypt
jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;
  let userRepo: any;

  beforeEach(() => {
    // Arrange global: mock del repositorio TypeORM
    userRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    service = new UserService(userRepo);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ════════════════════════════════════════════════════════════
  // MÓDULO: REGISTRO (R-01 a R-05)
  // ════════════════════════════════════════════════════════════

  // ──────────────────────────────────────────────────────────
  // R-01: Datos válidos → Usuario creado – 201
  // ──────────────────────────────────────────────────────────
  describe('R-01 – Registro exitoso con datos válidos', () => {
    it('debe crear un usuario correctamente y retornar datos sin password', async () => {
      // Arrange
      const createDto = {
        username: 'nuevouser',
        password: 'Password123',
        email: 'nuevo@email.com',
        avatar: 'http://avatar.png',
        bio: 'Soy un chef',
      };
      const hashedPassword = '$2b$10$hashedpassword';
      const createdUser = {
        id: 'uuid-nuevo',
        ...createDto,
        password: hashedPassword,
        role: 'user',
      };

      userRepo.findOne.mockResolvedValue(null); // username no existe, email no existe
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      userRepo.create.mockReturnValue(createdUser);
      userRepo.save.mockResolvedValue(createdUser);

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { username: 'nuevouser' } });
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 10);
      expect(userRepo.create).toHaveBeenCalledWith({
        ...createDto,
        password: hashedPassword,
      });
      expect(userRepo.save).toHaveBeenCalledWith(createdUser);
      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('username', 'nuevouser');
      expect(result).toHaveProperty('email', 'nuevo@email.com');
    });
  });

  // ──────────────────────────────────────────────────────────
  // R-02: Email duplicado → ConflictException
  // ──────────────────────────────────────────────────────────
  describe('R-02 – Email duplicado', () => {
    it('debe lanzar ConflictException si el email ya existe', async () => {
      // Arrange
      const createDto = {
        username: 'otrouser',
        password: 'Password123',
        email: 'duplicado@email.com',
      };
      // Primera búsqueda por username → no existe
      // Segunda búsqueda por email → ya existe
      userRepo.findOne
        .mockResolvedValueOnce(null) // username check
        .mockResolvedValueOnce({ id: 'uuid-existing', email: 'duplicado@email.com' }); // email check

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('debe incluir mensaje "Email already exists"', async () => {
      // Arrange
      const createDto = {
        username: 'otrouser',
        password: 'Password123',
        email: 'duplicado@email.com',
      };
      userRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'uuid-existing', email: 'duplicado@email.com' });

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow('Email already exists');
    });
  });

  // ──────────────────────────────────────────────────────────
  // R-03: Username duplicado → ConflictException
  // ──────────────────────────────────────────────────────────
  describe('R-03 – Username duplicado (campos obligatorios)', () => {
    it('debe lanzar ConflictException si el username ya está registrado', async () => {
      // Arrange
      const createDto = {
        username: 'existente',
        password: 'Password123',
        email: 'nuevo@email.com',
      };
      userRepo.findOne.mockResolvedValueOnce({ id: 'uuid-existente', username: 'existente' });

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('debe incluir mensaje "Username exists"', async () => {
      // Arrange
      const createDto = {
        username: 'existente',
        password: 'Password123',
        email: 'nuevo@email.com',
      };
      userRepo.findOne.mockResolvedValueOnce({ id: 'uuid-existente', username: 'existente' });

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow('Username exists');
    });
  });

  // ──────────────────────────────────────────────────────────
  // R-04: Contraseña corta → Seguridad (validación de hash)
  // ──────────────────────────────────────────────────────────
  describe('R-04 – Contraseña y hashing', () => {
    it('la contraseña se hashea con bcrypt antes de guardar', async () => {
      // Arrange
      const createDto = {
        username: 'hashuser',
        password: 'short',
        email: 'hash@email.com',
      };
      const hashedPassword = '$2b$10$hashedshort';
      userRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      userRepo.create.mockReturnValue({
        id: 'uuid-hash',
        ...createDto,
        password: hashedPassword,
      });
      userRepo.save.mockResolvedValue({
        id: 'uuid-hash',
        ...createDto,
        password: hashedPassword,
      });

      // Act
      await service.create(createDto);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('short', 10);
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ password: hashedPassword }),
      );
    });

    it('la contraseña original no se almacena en el resultado', async () => {
      // Arrange
      const createDto = {
        username: 'passuser',
        password: 'MiContraseña',
      };
      const hashed = '$2b$10$somehash';
      userRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashed);
      userRepo.create.mockReturnValue({
        id: 'uuid-pass',
        username: 'passuser',
        password: hashed,
      });
      userRepo.save.mockResolvedValue({
        id: 'uuid-pass',
        username: 'passuser',
        password: hashed,
      });

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(result).not.toHaveProperty('password');
    });
  });

  // ──────────────────────────────────────────────────────────
  // R-05: Email inválido → El servicio no valida formato
  // ──────────────────────────────────────────────────────────
  describe('R-05 – Email inválido', () => {
    it('el servicio actual no valida formato de email, acepta cualquier string', async () => {
      // Arrange
      const createDto = {
        username: 'invalidemail',
        password: 'Password123',
        email: 'esto-no-es-email',
      };
      userRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashed');
      const createdUser = {
        id: 'uuid-invalid',
        username: 'invalidemail',
        password: '$2b$10$hashed',
        email: 'esto-no-es-email',
      };
      userRepo.create.mockReturnValue(createdUser);
      userRepo.save.mockResolvedValue(createdUser);

      // Act
      const result = await service.create(createDto);

      // Assert
      // NOTA: El código actual NO valida formato de email en el servicio.
      // Según la tabla de casos R-05, debería retornar Error 400.
      expect(result).toHaveProperty('email', 'esto-no-es-email');
      expect(result).not.toHaveProperty('password');
    });
  });

  // ──────────────────────────────────────────────────────────
  // Camino adicional: Registro sin email (campo opcional)
  // ──────────────────────────────────────────────────────────
  describe('Camino adicional – Registro sin email', () => {
    it('debe permitir registrar un usuario sin email', async () => {
      // Arrange
      const createDto = {
        username: 'sinmail',
        password: 'Password123',
      };
      const hashed = '$2b$10$hashed';
      userRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashed);
      const createdUser = {
        id: 'uuid-sinmail',
        username: 'sinmail',
        password: hashed,
      };
      userRepo.create.mockReturnValue(createdUser);
      userRepo.save.mockResolvedValue(createdUser);

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(result).toHaveProperty('username', 'sinmail');
      expect(result).not.toHaveProperty('password');
    });
  });

  // ════════════════════════════════════════════════════════════
  // MÓDULO: PERFIL DE USUARIO (PU-01, PU-04, PU-05, PU-06)
  // ════════════════════════════════════════════════════════════

  // ──────────────────────────────────────────────────────────
  // PU-01: Token válido → Se retorna la información del perfil
  // ──────────────────────────────────────────────────────────
  describe('PU-01 – Consultar perfil exitoso', () => {
    it('debe retornar los datos del usuario sin password', async () => {
      // Arrange
      const userId = 'uuid-perfil';
      const mockUser = {
        id: userId,
        username: 'perfiluser',
        password: '$2b$10$hashed',
        email: 'perfil@email.com',
        avatar: 'http://avatar.png',
        bio: 'Mi bio',
        role: 'user',
      };
      userRepo.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findOne(userId);

      // Assert
      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('username', 'perfiluser');
      expect(result).toHaveProperty('email', 'perfil@email.com');
      expect(result).toHaveProperty('avatar', 'http://avatar.png');
      expect(result).toHaveProperty('bio', 'Mi bio');
    });
  });

  // ──────────────────────────────────────────────────────────
  // PU-04: Perfil sin recetas registradas
  // ──────────────────────────────────────────────────────────
  describe('PU-04 – Perfil sin recetas', () => {
    it('debe retornar el perfil correctamente con recetas vacías', async () => {
      // Arrange
      const userId = 'uuid-norecipes';
      const mockUser = {
        id: userId,
        username: 'norecipesuser',
        password: '$2b$10$hashed',
        email: 'norecipes@email.com',
        recipes: [],
      };
      userRepo.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findOne(userId);

      // Assert
      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('username', 'norecipesuser');
    });
  });

  // ──────────────────────────────────────────────────────────
  // PU-05: Perfil con recetas registradas
  // ──────────────────────────────────────────────────────────
  describe('PU-05 – Perfil con recetas', () => {
    it('debe retornar el perfil junto con el listado de sus recetas', async () => {
      // Arrange
      const userId = 'uuid-withrecipes';
      const mockUser = {
        id: userId,
        username: 'chefuser',
        password: '$2b$10$hashed',
        email: 'chef@email.com',
        recipes: [
          { id: 'recipe-1', name: 'Tacos', likes: 5 },
          { id: 'recipe-2', name: 'Empanadas', likes: 10 },
        ],
      };
      userRepo.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findOne(userId);

      // Assert
      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('recipes');
      expect((result as any).recipes).toHaveLength(2);
    });
  });

  // ──────────────────────────────────────────────────────────
  // PU-06: Usuario eliminado o no existente → Error 404
  // ──────────────────────────────────────────────────────────
  describe('PU-06 – Usuario no encontrado', () => {
    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      // Arrange
      const userId = 'uuid-no-existe';
      userRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar NotFoundException si el usuario fue soft-deleted', async () => {
      // Arrange
      const userId = 'uuid-deleted';
      userRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────────────
  // Camino adicional: findAll retorna lista de usuarios sin password
  // ──────────────────────────────────────────────────────────
  describe('Camino adicional – findAll', () => {
    it('debe retornar todos los usuarios sin el campo password', async () => {
      // Arrange
      const mockUsers = [
        { id: 'u1', username: 'user1', password: '$hash1', email: 'u1@email.com' },
        { id: 'u2', username: 'user2', password: '$hash2', email: 'u2@email.com' },
      ];
      userRepo.find.mockResolvedValue(mockUsers);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toHaveLength(2);
      result.forEach((user) => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('debe retornar lista vacía si no hay usuarios', async () => {
      // Arrange
      userRepo.find.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────────────────
  // Camino adicional: Update email duplicado
  // ──────────────────────────────────────────────────────────
  describe('Camino adicional – Update con email duplicado', () => {
    it('debe lanzar ConflictException si se actualiza a un email ya existente de otro usuario', async () => {
      // Arrange
      const userId = 'uuid-update';
      const updateDto = { email: 'yaexiste@email.com' };
      userRepo.findOne.mockResolvedValue({
        id: 'uuid-otro',
        email: 'yaexiste@email.com',
      });

      // Act & Assert
      await expect(service.update(userId, updateDto)).rejects.toThrow(ConflictException);
    });
  });

  // ──────────────────────────────────────────────────────────
  // Camino adicional: Remove exitoso y fallido
  // ──────────────────────────────────────────────────────────
  describe('Camino adicional – Remove', () => {
    it('debe retornar success al eliminar un usuario existente', async () => {
      // Arrange
      const userId = 'uuid-eliminar';
      userRepo.softDelete.mockResolvedValue({ affected: 1 });

      // Act
      const result = await service.remove(userId);

      // Assert
      expect(result).toEqual({ success: true, message: 'User removed' });
    });

    it('debe lanzar NotFoundException si el usuario a eliminar no existe', async () => {
      // Arrange
      const userId = 'uuid-no-existe';
      userRepo.softDelete.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(service.remove(userId)).rejects.toThrow(NotFoundException);
    });
  });
});
