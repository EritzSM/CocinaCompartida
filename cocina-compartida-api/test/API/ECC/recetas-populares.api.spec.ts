import { RecipesController } from '../../../src/recipes/recipes.controller';
import { RecipesService } from '../../../src/recipes/recipes.service';

import { Actor } from '../../screenplay/actor/Actor';
import { Afirmar } from '../../screenplay/fluent/Afirmar';

describe('Recetas Populares API Backend — Patrón Screenplay', () => {
  let controller: RecipesController;
  let recipesService: Partial<RecipesService>;

  beforeEach(() => {
    recipesService = { findTopLiked: jest.fn() };
    controller = new RecipesController(recipesService as RecipesService);
  });

  /**
   * Escenario 1:
   * Dado un visitante,
   * cuando consulta las recetas más populares,
   * entonces el controlador debe delegar al servicio y retornar los datos.
   */
  it('Dado un visitante, cuando consulta recetas populares, entonces debe delegar al servicio y retornar los datos', async () => {
    // Arrange
    const visitante = Actor.llamado('Visitante');
    const recetasEsperadas = [{ id: 'r1', likes: 10 }];
    (recipesService.findTopLiked as jest.Mock).mockResolvedValue(recetasEsperadas);

    // Act
    const resultado = await visitante.intentar(async () => controller.findTopLiked());

    // Assert
    Afirmar.que(recipesService.findTopLiked).fueLlamado();
    Afirmar.que(resultado).esEquivalenteA(recetasEsperadas);
  });
});
