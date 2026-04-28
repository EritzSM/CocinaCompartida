import { UserController } from '../../../src/user/user.controller';
import { UserService } from '../../../src/user/user.service';
import { NotFoundException } from '@nestjs/common';

describe('Ver Perfil API Backend', () => {
  let controller: UserController;
  let userService: Partial<UserService>;

  beforeEach(() => {
    userService = {
      findOne: jest.fn(),
    };
    controller = new UserController(userService as UserService);
  });

  // Verifica que el controlador devuelve el perfil cuando el servicio responde OK.
  it('VerPerfilApi_CuandoUsuarioExiste_DebeRetornarPerfil', async () => {
    // Arrange
    const profile = {
      id: '1',
      username: 'testuser',
      email: 'test@test.com',
      avatar: 'av.png',
      bio: 'bio',
    };
    (userService.findOne as jest.Mock).mockResolvedValue(profile);

    // Act
    const result = await controller.findOne('1');

    // Assert
    expect(userService.findOne).toHaveBeenCalledWith('1');
    expect(result).toEqual(profile);
  });

  // Verifica que el payload incluye campos visibles y omite el password.
  it('VerPerfilApi_CuandoUsuarioExiste_DebeIncluirCamposEsperados', async () => {
    // Arrange
    const profile = {
      id: '1',
      username: 'testuser',
      email: 'test@test.com',
      avatar: 'av.png',
      bio: 'bio',
    };
    (userService.findOne as jest.Mock).mockResolvedValue(profile);

    // Act
    const result = await controller.findOne('1');

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
        avatar: 'av.png',
        bio: 'bio',
      })
    );
    expect(result).not.toHaveProperty('password');
  });

  // Verifica que se propaga NotFound cuando el usuario no existe.
  it('VerPerfilApi_CuandoUsuarioNoExiste_DebeLanzarNotFound', async () => {
    // Arrange
    (userService.findOne as jest.Mock).mockRejectedValue(new NotFoundException());

    // Act
    await expect(controller.findOne('missing')).rejects.toThrow(NotFoundException);

    // Assert
  });
});
