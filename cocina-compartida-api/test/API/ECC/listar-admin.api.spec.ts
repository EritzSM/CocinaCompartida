import { UserController } from '../../../src/user/user.controller';
import { UserService } from '../../../src/user/user.service';

import { Actor } from '../../screenplay/actor/Actor';
import { Afirmar } from '../../screenplay/fluent/Afirmar';

describe('Listar Admin API Backend — Patrón Screenplay', () => {
  let controller: UserController;
  let userService: Partial<UserService>;

  beforeEach(() => {
    userService = { findAll: jest.fn() };
    controller = new UserController(userService as UserService);
  });

  /**
   * Escenario 1:
   * Dado un administrador,
   * cuando consulta el listado de usuarios,
   * entonces el controlador debe delegar al servicio y retornar los datos.
   */
  it('Dado un administrador, cuando consulta el listado, entonces debe delegar al servicio y retornar los datos', async () => {
    // Arrange
    const administrador = Actor.llamado('Administrador');
    const usuariosEsperados = [{ id: 'u1', username: 'admin' }];
    (userService.findAll as jest.Mock).mockResolvedValue(usuariosEsperados);

    // Act
    const resultado = await administrador.intentar(async () => controller.findAll());

    // Assert
    Afirmar.que(userService.findAll).fueLlamado();
    Afirmar.que(resultado).esEquivalenteA(usuariosEsperados);
  });
});
