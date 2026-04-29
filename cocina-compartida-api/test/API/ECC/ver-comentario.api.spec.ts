import { NotFoundException } from '@nestjs/common';
import { RecipesController } from '../../../src/recipes/recipes.controller';
import { RecipesService } from '../../../src/recipes/recipes.service';

import { Actor } from '../../screenplay/actor/Actor';
import { Afirmar } from '../../screenplay/fluent/Afirmar';

describe('Ver Comentario API Backend — Patrón Screenplay', () => {
  let controller: RecipesController;
  let recipesService: Partial<RecipesService>;

  beforeEach(() => {
    recipesService = { findCommentsByRecipe: jest.fn() };
    controller = new RecipesController(recipesService as RecipesService);
  });

  /**
   * Escenario 1:
   * Dado un visitante que consulta los comentarios de una receta existente,
   * cuando el servicio responde,
   * entonces debe retornar la lista de comentarios.
   */
  it('Dado una receta existente, cuando el visitante consulta los comentarios, entonces debe retornar la lista', async () => {
    // Arrange
    const visitante = Actor.llamado('Visitante');
    const comentariosEsperados = [
      { id: 'c1', message: 'Buenisima', user: { id: 'u1', username: 'fan' } },
      { id: 'c2', message: 'Excelente', user: { id: 'u2', username: 'fan2' } },
    ];
    (recipesService.findCommentsByRecipe as jest.Mock).mockResolvedValue(comentariosEsperados);

    // Act
    const resultado = await visitante.intentar(async () => controller.listComments('r1'));

    // Assert
    Afirmar.que(recipesService.findCommentsByRecipe).fueLlamadoCon('r1');
    Afirmar.que(resultado).esEquivalenteA(comentariosEsperados);
  });

  /**
   * Escenario 2:
   * Dado un visitante que consulta comentarios de una receta inexistente,
   * cuando el servicio lanza NotFoundException,
   * entonces el controlador debe propagar el error.
   */
  it('Dado una receta inexistente, cuando el servicio lanza NotFound, entonces debe propagar la excepción', async () => {
    // Arrange
    const visitante = Actor.llamado('Visitante');
    (recipesService.findCommentsByRecipe as jest.Mock).mockRejectedValue(new NotFoundException());

    // Act
    const accion = visitante.intentar(async () => controller.listComments('missing'));

    // Assert
    await Afirmar.que(accion).rechazaCon(NotFoundException);
  });
});
