import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UserService } from '../../../src/user/user.service';

describe('Ver Perfil Regression Backend', () => {
  const DB_USER = {
    id: '1',
    username: 'testuser',
    password: 'hashed',
    email: 'test@test.com',
    avatar: 'av.png',
    bio: 'bio',
  };

  let service: UserService;
  let userRepo: { findOne: jest.Mock };

  beforeEach(() => {
    userRepo = {
      findOne: jest.fn(),
    };
    service = new UserService(userRepo as any);
  });

  // Verifica que el servicio no expone el password en la respuesta.
  it('VerPerfil_CuandoUsuarioExiste_DebeOmitirPassword', async () => {
    // Arrange
    userRepo.findOne.mockResolvedValue({ ...DB_USER });

    // Act
    const result = await service.findOne('1');

    // Assert
    expect(result).toBeDefined();
    expect((result as any).password).toBeUndefined();
  });

  // Verifica que el servicio lanza NotFound cuando no hay usuario.
  it('VerPerfil_CuandoUsuarioNoExiste_DebeLanzarNotFound', async () => {
    // Arrange
    userRepo.findOne.mockResolvedValue(null);

    // Act
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);

    // Assert
  });

  // Verifica que un error del repositorio se traduce a InternalServerError.
  it('VerPerfil_CuandoRepositorioFalla_DebeLanzarInternalServerError', async () => {
    // Arrange
    userRepo.findOne.mockImplementation(() => {
      throw new Error('db');
    });

    // Act
    await expect(service.findOne('1')).rejects.toThrow(InternalServerErrorException);

    // Assert
  });
});
