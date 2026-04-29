import { UserController } from '../../../src/user/user.controller';
import { UserService } from '../../../src/user/user.service';
import { NotFoundException } from '@nestjs/common';

import { Actor } from '../../screenplay/actor/Actor';
import { Afirmar } from '../../screenplay/fluent/Afirmar';

describe('Ver Perfil API Backend — Patrón Screenplay', () => {
  let controller: UserController;
  let userService: Partial<UserService>;

  beforeEach(() => {
    userService = { findOne: jest.fn() };
    controller = new UserController(userService as UserService);
  });

  /**
   * Escenario 1:
   * Dado un visitante que consulta un perfil existente,
   * cuando el servicio responde con el usuario,
   * entonces debe retornar el perfil completo.
   */
  it('Dado un usuario existente, cuando el visitante consulta el perfil, entonces debe retornar el perfil', async () => {
    // Arrange
    const visitante = Actor.llamado('Visitante');
    const perfilEsperado = {
      id: '1',
      username: 'testuser',
      email: 'test@test.com',
      avatar: 'av.png',
      bio: 'bio',
    };
    (userService.findOne as jest.Mock).mockResolvedValue(perfilEsperado);

    // Act
    const resultado = await visitante.intentar(async () => controller.findOne('1'));

    // Assert
    Afirmar.que(userService.findOne).fueLlamadoCon('1');
    Afirmar.que(resultado).esEquivalenteA(perfilEsperado);
  });

  /**
   * Escenario 2:
   * Dado un visitante que consulta un perfil existente,
   * cuando el servicio responde,
   * entonces el payload debe incluir los campos esperados y NO exponer el password.
   */
  it('Dado un usuario existente, cuando el visitante consulta el perfil, entonces los campos públicos deben estar presentes y el password ausente', async () => {
    // Arrange
    const visitante = Actor.llamado('Visitante');
    const perfilPublico = {
      id: '1',
      username: 'testuser',
      email: 'test@test.com',
      avatar: 'av.png',
      bio: 'bio',
    };
    (userService.findOne as jest.Mock).mockResolvedValue(perfilPublico);

    // Act
    const resultado = await visitante.intentar(async () => controller.findOne('1'));

    // Assert — Campos públicos presentes, password ausente
    Afirmar.que(resultado).contieneObjeto({
      id: '1',
      username: 'testuser',
      email: 'test@test.com',
      avatar: 'av.png',
      bio: 'bio',
    });
    Afirmar.que(resultado).noTienePropiedad('password');
  });

  /**
   * Escenario 3:
   * Dado un visitante que consulta un usuario inexistente,
   * cuando el servicio lanza NotFoundException,
   * entonces el controlador debe propagar la excepción.
   */
  it('Dado un usuario inexistente, cuando el visitante consulta el perfil, entonces debe propagar NotFoundException', async () => {
    // Arrange
    const visitante = Actor.llamado('Visitante');
    (userService.findOne as jest.Mock).mockRejectedValue(new NotFoundException());

    // Act
    const accion = visitante.intentar(async () => controller.findOne('missing'));

    // Assert
    await Afirmar.que(accion).rechazaCon(NotFoundException);
  });
});
