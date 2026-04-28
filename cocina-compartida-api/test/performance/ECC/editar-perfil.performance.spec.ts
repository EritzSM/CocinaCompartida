import { UserService } from '../../../src/user/user.service';

describe('Editar Perfil Performance Backend', () => {
  // Verifica que el update sin email no hace consultas extra.
  it('EditarPerfil_CuandoNoActualizaEmail_DebeConsultarRepositorioUnaVez', async () => {
    // Arrange
    const userRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'u1',
        username: 'nuevo',
        email: 'test@test.com',
      }),
      update: jest.fn().mockResolvedValue({}),
    };
    const service = new UserService(userRepo as any);

    // Act
    await service.update('u1', { username: 'nuevo' } as any);

    // Assert
    expect(userRepo.update).toHaveBeenCalledTimes(1);
    expect(userRepo.findOne).toHaveBeenCalledTimes(1);
  });
});
