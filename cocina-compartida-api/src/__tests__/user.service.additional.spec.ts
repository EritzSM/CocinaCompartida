import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UserService } from '../user/user.service';

describe('UserService Additional Coverage', () => {
  let service: UserService;
  let userRepo: {
    findOne: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
    delete: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(() => {
    userRepo = {
      findOne: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      delete: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    service = new UserService(userRepo as any);
  });

  it('Update_CuandoDtoVacio_DebeLanzarBadRequest', async () => {
    // Arrange
    userRepo.update.mockResolvedValue({});

    // Act
    const action = service.update('u1', {} as any);

    // Assert
    await expect(action).rejects.toThrow(BadRequestException);
    expect(userRepo.update).toHaveBeenCalledWith({ id: 'u1' }, {});
    expect(userRepo.findOne).not.toHaveBeenCalled();
  });

  it('Update_CuandoEmailCoincideConMismoUsuario_DebeActualizar', async () => {
    // Arrange
    userRepo.findOne
      .mockResolvedValueOnce({ id: 'u1', email: 'user@test.com' })
      .mockResolvedValueOnce({ id: 'u1', username: 'user', email: 'user@test.com', password: 'hash' });
    userRepo.update.mockResolvedValue({});

    // Act
    const result = await service.update('u1', { email: 'user@test.com', bio: 'bio' } as any);

    // Assert
    expect(userRepo.update).toHaveBeenCalledWith({ id: 'u1' }, { email: 'user@test.com', bio: 'bio' });
    expect(result).not.toHaveProperty('password');
    expect(result).toHaveProperty('email', 'user@test.com');
  });

  it('Update_CuandoUsuarioNoExiste_DebeLanzarNotFound', async () => {
    // Arrange
    userRepo.update.mockResolvedValue({});
    userRepo.findOne.mockResolvedValue(null);

    // Act
    const action = service.update('u1', { bio: 'bio' } as any);

    // Assert
    await expect(action).rejects.toThrow(NotFoundException);
  });

  it('FindByEmail_CuandoEmailExiste_DebeRetornarUsuario', async () => {
    // Arrange
    const user = { id: 'u1', username: 'user', password: 'hash', email: 'user@test.com', avatar: 'av.png' };
    userRepo.findOne.mockResolvedValue(user);

    // Act
    const result = await service.findByEmail('user@test.com');

    // Assert
    expect(userRepo.findOne).toHaveBeenCalledWith({
      where: { email: 'user@test.com' },
      select: ['id', 'username', 'password', 'email', 'avatar'],
    });
    expect(result).toEqual(user);
  });

  it('FindOne_CuandoRepositorioFalla_DebeLanzarInternalServerError', async () => {
    // Arrange
    userRepo.findOne.mockImplementation(() => {
      throw new Error('db');
    });

    // Act
    const action = service.findOne('u1');

    // Assert
    await expect(action).rejects.toThrow(InternalServerErrorException);
  });

  it('RemoveByEmail_CuandoUsuarioExiste_DebeEliminarYRetornarUserId', async () => {
    userRepo.findOne.mockResolvedValue({ id: 'u1', email: 'qa@test.com' });
    userRepo.delete.mockResolvedValue({ affected: 1 });

    const result = await service.removeByEmail('qa@test.com');

    expect(userRepo.findOne).toHaveBeenCalledWith({ where: { email: 'qa@test.com' } });
    expect(userRepo.delete).toHaveBeenCalledWith('u1');
    expect(result).toEqual({ success: true, message: 'User removed', userId: 'u1' });
  });

  it('RemoveByEmail_CuandoEmailNoExiste_DebeLanzarNotFound', async () => {
    userRepo.findOne.mockResolvedValue(null);

    await expect(service.removeByEmail('missing@test.com')).rejects.toThrow(NotFoundException);
    expect(userRepo.delete).not.toHaveBeenCalled();
  });

  it('RemoveByEmail_CuandoDeleteNoAfectaFilas_DebeLanzarInternalServerError', async () => {
    userRepo.findOne.mockResolvedValue({ id: 'u1', email: 'qa@test.com' });
    userRepo.delete.mockResolvedValue({ affected: 0 });

    await expect(service.removeByEmail('qa@test.com')).rejects.toThrow(InternalServerErrorException);
  });
});
