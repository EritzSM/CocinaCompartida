import { UserController } from '../../../src/user/user.controller';
import { UserService } from '../../../src/user/user.service';

describe('Listar Admin API Backend', () => {
  let controller: UserController;
  let userService: Partial<UserService>;

  beforeEach(() => {
    userService = { findAll: jest.fn() };
    controller = new UserController(userService as UserService);
  });

  // Verifica que el controlador delega al servicio.
  it('ListarAdminApi_CuandoSeConsulta_DebeDelegar', async () => {
    // Arrange
    const data = [{ id: 'u1', username: 'admin' }];
    (userService.findAll as jest.Mock).mockResolvedValue(data);

    // Act
    const result = await controller.findAll();

    // Assert
    expect(userService.findAll).toHaveBeenCalled();
    expect(result).toEqual(data);
  });
});
