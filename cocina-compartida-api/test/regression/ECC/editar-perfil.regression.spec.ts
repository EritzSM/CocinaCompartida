import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { UserService } from '../../../src/user/user.service';

describe('Editar Perfil Regression Backend', () => {
  // Verifica que un dto vacio retorna BadRequest.
  it('EditarPerfil_CuandoDtoVacio_DebeLanzarBadRequest', async () => {
    // Arrange
    const userRepo = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    };
    const service = new UserService(userRepo as any);

    // Act
    const action = service.update('u1', {} as any);

    // Assert
    await expect(action).rejects.toThrow(BadRequestException);
    expect(userRepo.update).toHaveBeenCalledWith({ id: 'u1' }, {});
  });

  // Verifica conflicto si el email pertenece a otro usuario.
  it('EditarPerfil_CuandoEmailExisteEnOtroUsuario_DebeLanzarConflict', async () => {
    // Arrange
    const userRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'u2', email: 'dup@test.com' }),
      update: jest.fn(),
    };
    const service = new UserService(userRepo as any);

    // Act
    const action = service.update('u1', { email: 'dup@test.com' } as any);

    // Assert
    await expect(action).rejects.toThrow(ConflictException);
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  // Verifica NotFound si el usuario no existe despues de actualizar.
  it('EditarPerfil_CuandoUsuarioNoExiste_DebeLanzarNotFound', async () => {
    // Arrange
    const userRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
    };
    const service = new UserService(userRepo as any);

    // Act
    const action = service.update('u1', { username: 'nuevo' } as any);

    // Assert
    await expect(action).rejects.toThrow(NotFoundException);
  });
});
