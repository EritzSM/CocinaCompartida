import { UserService } from '../../../src/user/user.service';

describe('Listar Admin Performance Backend', () => {
  // Verifica que el repositorio se consulta una sola vez.
  it('ListarAdmin_CuandoSeConsulta_DebeLlamarRepositorioUnaSolaVez', async () => {
    // Arrange
    const userRepo = { find: jest.fn().mockResolvedValue([]) };
    const service = new UserService(userRepo as any);

    // Act
    await service.findAll();

    // Assert
    expect(userRepo.find).toHaveBeenCalledTimes(1);
  });
});
