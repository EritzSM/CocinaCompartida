import { RecipesController } from '../../../src/recipes/recipes.controller';
import { RecipesService } from '../../../src/recipes/recipes.service';
import { Actor } from '../../screenplay/actor/Actor';
import { Afirmar } from '../../screenplay/fluent/Afirmar';

describe('Favoritos Bookmarks API Backend - Patron Screenplay', () => {
  let controller: RecipesController;
  let recipesService: Partial<RecipesService>;
  const user = { id: 'u-fav', username: 'favorito' };

  beforeEach(() => {
    recipesService = { toggleLike: jest.fn() };
    controller = new RecipesController(recipesService as RecipesService);
  });

  it('Dado un usuario autenticado, cuando marca una receta como favorita, entonces actualiza likedBy', async () => {
    const usuario = Actor.llamado('Usuario');
    const respuesta = { likes: 1, likedBy: ['u-fav'] };
    (recipesService.toggleLike as jest.Mock).mockResolvedValue(respuesta);

    const resultado = await usuario.intentar(async () => controller.toggleLike('r1', { user }));

    Afirmar.que(recipesService.toggleLike).fueLlamadoCon('r1', user);
    Afirmar.que(resultado).esEquivalenteA(respuesta);
  });
});
