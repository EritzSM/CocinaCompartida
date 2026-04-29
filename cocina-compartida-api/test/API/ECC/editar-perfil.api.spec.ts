import { UserController } from '../../../src/user/user.controller';
import { UserService } from '../../../src/user/user.service';

import { Actor } from '../../screenplay/actor/Actor';
import { Afirmar } from '../../screenplay/fluent/Afirmar';

describe('Editar Perfil API Backend — Patrón Screenplay', () => {
  let controller: UserController;
  let userService: Partial<UserService>;

  beforeEach(() => {
    userService = { update: jest.fn() };
    controller = new UserController(userService as UserService);
  });

  /**
   * Escenario 1:
   * Dado un administrador con datos válidos,
   * cuando edita su perfil,
   * entonces el controlador debe delegar la actualización con el id autenticado.
   */
  it('Dado un dto válido, cuando el actor edita el perfil, entonces debe delegar update con el id autenticado', async () => {
    // Arrange — Actor y datos de contexto
    const administrador = Actor.llamado('Administrador');
    const req = { user: { id: 'u1' } };
    const updateDto = { username: 'nuevoNombre' };
    const usuarioActualizado = {
      id: 'u1',
      username: 'nuevoNombre',
      email: 'test@test.com',
      avatar: 'av.png',
      bio: 'bio',
    };
    (userService.update as jest.Mock).mockResolvedValue(usuarioActualizado);

    // Act — El actor realiza la tarea directamente (unit test de controlador)
    const resultado = await administrador.intentar(async () =>
      controller.update(updateDto as any, req as any),
    );

    // Assert — Fluent assertions
    Afirmar.que(userService.update).fueLlamadoCon('u1', updateDto);
    Afirmar.que(resultado).esEquivalenteA(usuarioActualizado);
  });

  /**
   * Escenario 2:
   * Dado que el servicio retorna el usuario,
   * cuando el actor revisa el resultado,
   * entonces el payload no debe exponer el password.
   */
  it('Dado que el servicio retorna un usuario, cuando el actor revisa la respuesta, entonces no debe exponer el password', async () => {
    // Arrange
    const administrador = Actor.llamado('Administrador');
    const req = { user: { id: 'u1' } };
    const updateDto = { bio: 'bio nueva' };
    const usuarioActualizado = {
      id: 'u1',
      username: 'testuser',
      email: 'test@test.com',
      avatar: 'av.png',
      bio: 'bio nueva',
    };
    (userService.update as jest.Mock).mockResolvedValue(usuarioActualizado);

    // Act
    const resultado = await administrador.intentar(async () =>
      controller.update(updateDto as any, req as any),
    );

    // Assert — El resultado no debe tener campo password
    Afirmar.que(resultado).noTienePropiedad('password');
  });
});
