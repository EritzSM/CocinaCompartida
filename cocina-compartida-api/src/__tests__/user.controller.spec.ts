import { UserController } from '../user/user.controller';
import { UserService } from '../user/user.service';
import { NotFoundException } from '@nestjs/common';

describe('UserController', () => {
  let controller: UserController;
  let userService: Partial<UserService>;

  beforeEach(() => {
    // Arrange global: mock del UserService
    userService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      removeByEmail: jest.fn(),
    };
    controller = new UserController(userService as UserService);
  });

  // PU-01: GET /users/:id con token válido → perfil correcto

  describe('PU-01  Consulta de perfil exitosa', () => {
    it('debe llamar a userService.findOne con el id y retornar el perfil', async () => {
      // Arrange
      const userId = 'uuid-perfil';
      const mockProfile = {
        id: userId,
        username: 'profileuser',
        email: 'profile@email.com',
        avatar: 'http://avatar.png',
        bio: 'Chef profesional',
      };
      (userService.findOne as jest.Mock).mockResolvedValue(mockProfile);

      // Act
      const result = await controller.findOne(userId);

      // Assert
      expect(userService.findOne).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockProfile);
    });
  });


  // PU-06: GET /users/:id → Usuario no encontrado → 404

  describe('PU-06  Usuario no encontrado', () => {
    it('debe propagar NotFoundException desde el servicio', async () => {
      // Arrange
      const userId = 'uuid-no-existe';
      (userService.findOne as jest.Mock).mockRejectedValue(
        new NotFoundException(),
      );

      // Act & Assert
      await expect(controller.findOne(userId)).rejects.toThrow(NotFoundException);
    });
  });


  // POST /users → Registro delega correctamente

  describe('Registro Controller delega al servicio', () => {
    it('debe llamar a userService.create con el DTO completo', async () => {
      // Arrange
      const createDto = {
        username: 'newuser',
        password: 'Password123',
        email: 'new@email.com',
      };
      const createdUser = {
        id: 'uuid-new',
        username: 'newuser',
        email: 'new@email.com',
      };
      (userService.create as jest.Mock).mockResolvedValue(createdUser);

      // Act
      const result = await controller.create(createDto);

      // Assert
      expect(userService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(createdUser);
    });
  });


  // PATCH /users → Update con request autenticado

  describe('Update Controller delega al servicio', () => {
    it('debe llamar a userService.update con id del usuario autenticado', async () => {
      // Arrange
      const updateDto = { bio: 'Nueva bio' };
      const req = { user: { id: 'uuid-auth' } };
      const updatedUser = {
        id: 'uuid-auth',
        username: 'authuser',
        bio: 'Nueva bio',
      };
      (userService.update as jest.Mock).mockResolvedValue(updatedUser);

      // Act
      const result = await controller.update(updateDto, req);

      // Assert
      expect(userService.update).toHaveBeenCalledWith('uuid-auth', updateDto);
      expect(result).toEqual(updatedUser);
    });
  });


  // GET /users → findAll

  describe('findAll Controller delega al servicio', () => {
    it('debe retornar la lista de usuarios del servicio', async () => {
      // Arrange
      const mockUsers = [
        { id: 'u1', username: 'user1' },
        { id: 'u2', username: 'user2' },
      ];
      (userService.findAll as jest.Mock).mockResolvedValue(mockUsers);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(userService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });


  // DELETE /users/:id → Remove

  describe('Remove Controller delega al servicio', () => {
    it('debe llamar a userService.remove con el id', async () => {
      // Arrange
      const userId = 'uuid-delete';
      (userService.remove as jest.Mock).mockResolvedValue({ success: true });

      // Act
      const result = await controller.remove(userId);

      // Assert
      expect(userService.remove).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ success: true });
    });
  });

  describe('RemoveByEmailForTesting Controller delega al servicio', () => {
    it('debe llamar a userService.removeByEmail con el email recibido', async () => {
      const response = { success: true, message: 'User removed', userId: 'u1' };
      (userService.removeByEmail as jest.Mock).mockResolvedValue(response);

      const result = await controller.removeByEmailForTesting('qa@test.com');

      expect(userService.removeByEmail).toHaveBeenCalledWith('qa@test.com');
      expect(result).toEqual(response);
    });
  });
});
