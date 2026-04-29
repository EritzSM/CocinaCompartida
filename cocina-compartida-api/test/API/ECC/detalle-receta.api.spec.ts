import { RecipesController } from '../../../src/recipes/recipes.controller';
import { RecipesService } from '../../../src/recipes/recipes.service';
import { Actor } from '../../screenplay/actor/Actor';
import { Afirmar } from '../../screenplay/fluent/Afirmar';

describe('Detalle de Receta API Backend - Patron Screenplay', () => {
  let controller: RecipesController;
  let recipesService: Partial<RecipesService>;

  beforeEach(() => {
    recipesService = { findOne: jest.fn() };
    controller = new RecipesController(recipesService as RecipesService);
  });

  it('Dado un visitante, cuando consulta una receta por id, entonces recibe ingredientes pasos y autor', async () => {
    const visitante = Actor.llamado('Visitante');
    const receta = {
      id: 'r1',
      name: 'Tortilla',
      descripcion: 'Receta completa',
      ingredients: ['huevo'],
      steps: ['batir'],
      user: { id: 'u1', username: 'chef' },
    };
    (recipesService.findOne as jest.Mock).mockResolvedValue(receta);

    const resultado = await visitante.intentar(async () => controller.findOne('r1'));

    Afirmar.que(recipesService.findOne).fueLlamadoCon('r1');
    Afirmar.que(resultado).contieneObjeto({
      id: 'r1',
      name: 'Tortilla',
      ingredients: ['huevo'],
      steps: ['batir'],
    });
    Afirmar.que(resultado).tienePropiedad('user');
  });
});
