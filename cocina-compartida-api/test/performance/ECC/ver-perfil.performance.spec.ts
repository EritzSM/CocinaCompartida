import { UserService } from '../../../src/user/user.service';

describe('Ver Perfil Performance Backend', () => {
  const DB_USER = {
    id: '1',
    username: 'testuser',
    password: 'hashed',
    email: 'test@test.com',
  };

  // Verifica que el servicio hace una sola consulta al repositorio por id.
  it('VerPerfil_CuandoBuscaPorId_DebeConsultarRepositorioUnaVez', async () => {
    // Arrange
    const userRepo = {
      findOne: jest.fn().mockResolvedValue({ ...DB_USER }),
    };
    const service = new UserService(userRepo as any);

    // Act
    await service.findOne('1');

    // Assert
    expect(userRepo.findOne).toHaveBeenCalledTimes(1);
  });
});
