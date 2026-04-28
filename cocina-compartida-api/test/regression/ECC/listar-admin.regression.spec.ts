import { UserService } from '../../../src/user/user.service';

describe('Listar Admin Regression Backend', () => {
  let service: UserService;
  let userRepo: { find: jest.Mock };

  beforeEach(() => {
    userRepo = { find: jest.fn() };
    service = new UserService(userRepo as any);
  });

  // Verifica que los usuarios no exponen password.
  it('ListarAdmin_CuandoHayUsuarios_DebeOmitirPassword', async () => {
    // Arrange
    userRepo.find.mockResolvedValue([
      { id: 'u1', username: 'user', password: 'hash' },
      { id: 'u2', username: 'user2', password: 'hash2' },
    ]);

    // Act
    const result = await service.findAll();

    // Assert
    result.forEach((u: any) => expect(u.password).toBeUndefined());
  });

  // Verifica que retorna lista vacia si no hay usuarios.
  it('ListarAdmin_CuandoNoHayUsuarios_DebeRetornarListaVacia', async () => {
    // Arrange
    userRepo.find.mockResolvedValue([]);

    // Act
    const result = await service.findAll();

    // Assert
    expect(result).toEqual([]);
  });
});
