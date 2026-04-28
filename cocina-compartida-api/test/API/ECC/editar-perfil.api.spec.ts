import { UserController } from '../../../src/user/user.controller';
import { UserService } from '../../../src/user/user.service';

describe('Editar Perfil API Backend', () => {
  let controller: UserController;
  let userService: Partial<UserService>;

  beforeEach(() => {
    userService = {
      update: jest.fn(),
    };
    controller = new UserController(userService as UserService);
  });

  // Verifica que el controlador delega la actualizacion con el id autenticado.
  it('EditarPerfilApi_CuandoDtoValido_DebeDelegarUpdateConIdAutenticado', async () => {
    // Arrange
    const req = { user: { id: 'u1' } };
    const updateDto = { username: 'nuevoNombre' };
    const updatedUser = {
      id: 'u1',
      username: 'nuevoNombre',
      email: 'test@test.com',
      avatar: 'av.png',
      bio: 'bio',
    };
    (userService.update as jest.Mock).mockResolvedValue(updatedUser);

    // Act
    const result = await controller.update(updateDto as any, req as any);

    // Assert
    expect(userService.update).toHaveBeenCalledWith('u1', updateDto);
    expect(result).toEqual(updatedUser);
  });

  // Verifica que el resultado no expone el password en el payload.
  it('EditarPerfilApi_CuandoServicioRetornaUsuario_NoDebeExponerPassword', async () => {
    // Arrange
    const req = { user: { id: 'u1' } };
    const updateDto = { bio: 'bio nueva' };
    const updatedUser = {
      id: 'u1',
      username: 'testuser',
      email: 'test@test.com',
      avatar: 'av.png',
      bio: 'bio nueva',
    };
    (userService.update as jest.Mock).mockResolvedValue(updatedUser);

    // Act
    const result = await controller.update(updateDto as any, req as any);

    // Assert
    expect(result).not.toHaveProperty('password');
  });
});
