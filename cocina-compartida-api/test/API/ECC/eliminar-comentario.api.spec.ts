import { ForbiddenException } from '@nestjs/common';
import { RecipesController } from '../../../src/recipes/recipes.controller';
import { RecipesService } from '../../../src/recipes/recipes.service';

import { Actor } from '../../screenplay/actor/Actor';
import { Afirmar } from '../../screenplay/fluent/Afirmar';

describe('Eliminar Comentario API Backend — Patrón Screenplay', () => {
  let controller: RecipesController;
  let recipesService: Partial<RecipesService>;

  beforeEach(() => {
    recipesService = { removeComment: jest.fn() };
    controller = new RecipesController(recipesService as RecipesService);
  });

  /**
   * Escenario 1:
   * Dado un moderador con solicitud válida,
   * cuando elimina el comentario,
   * entonces el controlador debe delegar al servicio.
   */
  it('Dado una solicitud válida, cuando el moderador elimina el comentario, entonces debe delegar al servicio', async () => {
    // Arrange
    const moderador = Actor.llamado('Moderador');
    const req = { user: { id: 'u1' } };
    (recipesService.removeComment as jest.Mock).mockResolvedValue(undefined);

    // Act
    const resultado = await moderador.intentar(async () =>
      controller.deleteComment('c1', req as any),
    );

    // Assert
    Afirmar.que(recipesService.removeComment).fueLlamadoCon('c1', req.user);
    Afirmar.que(resultado).esIndefinido();
  });

  /**
   * Escenario 2:
   * Dado que el servicio lanza un error de acceso,
   * cuando el moderador intenta eliminar,
   * entonces el controlador debe propagar la excepción.
   */
  it('Dado que el servicio lanza ForbiddenException, cuando el moderador actúa, entonces debe propagar el error', async () => {
    // Arrange
    const moderador = Actor.llamado('Moderador');
    const req = { user: { id: 'u1' } };
    (recipesService.removeComment as jest.Mock).mockRejectedValue(new ForbiddenException());

    // Act — capturamos la promesa para verificar el rechazo
    const accion = moderador.intentar(async () =>
      controller.deleteComment('c1', req as any),
    );

    // Assert — Fluent async assertion
    await Afirmar.que(accion).rechazaCon(ForbiddenException);
  });
});
