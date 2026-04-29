import { RecipesController } from '../../../src/recipes/recipes.controller';
import { RecipesService } from '../../../src/recipes/recipes.service';
import { Actor } from '../../screenplay/actor/Actor';
import { Afirmar } from '../../screenplay/fluent/Afirmar';

describe('Explorar Recetas API Backend - Patron Screenplay', () => {
  let controller: RecipesController;
  let recipesService: Partial<RecipesService>;

  beforeEach(() => {
    recipesService = { findAll: jest.fn() };
    controller = new RecipesController(recipesService as RecipesService);
  });

  it('Dado un visitante, cuando explora recetas, entonces debe obtener la lista publica', async () => {
    const visitante = Actor.llamado('Visitante');
    const recetas = [
      { id: 'r1', name: 'Arepa', category: 'desayuno', likes: 3 },
      { id: 'r2', name: 'Sopa', category: 'cena', likes: 1 },
    ];
    (recipesService.findAll as jest.Mock).mockResolvedValue(recetas);

    const resultado = await visitante.intentar(async () => controller.findAll());

    Afirmar.que(recipesService.findAll).fueLlamado();
    Afirmar.que(resultado).esEquivalenteA(recetas);
  });
});
