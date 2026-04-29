import { NotFoundException } from '@nestjs/common';
import { RecipesService } from '../../../src/recipes/recipes.service';
import { Afirmar } from '../../screenplay/fluent/Afirmar';

describe('Favoritos Bookmarks Regression Backend', () => {
  let recipe: any;
  let recipeRepo: any;
  let service: RecipesService;

  beforeEach(() => {
    recipe = { id: 'r1', likedBy: [], likes: 0, user: { id: 'owner' } };
    recipeRepo = {
      findOne: jest.fn().mockResolvedValue(recipe),
      save: jest.fn(async (data) => data),
      find: jest.fn(),
    };
    service = new RecipesService(recipeRepo, { find: jest.fn(), findOne: jest.fn() } as any);
  });

  it('Dado un usuario sin favorito, cuando alterna like, entonces queda guardado en likedBy', async () => {
    const result = await service.toggleLike('r1', { id: 'u1' } as any);

    Afirmar.que(result.likes).esIgualA(1);
    Afirmar.que(result.likedBy).esEquivalenteA(['u1']);
  });

  it('Dado un usuario con favorito, cuando alterna like, entonces se remueve de likedBy', async () => {
    recipe.likedBy = ['u1'];
    recipe.likes = 1;

    const result = await service.toggleLike('r1', { id: 'u1' } as any);

    Afirmar.que(result.likes).esIgualA(0);
    Afirmar.que(result.likedBy).esEquivalenteA([]);
  });

  it('Dado una receta inexistente, cuando alterna like, entonces lanza NotFound y no llama save', async () => {
    recipeRepo.findOne.mockResolvedValue(null);

    await Afirmar.que(service.toggleLike('no-existe', { id: 'u1' } as any)).rechazaCon(NotFoundException);
    expect(recipeRepo.save).not.toHaveBeenCalled();
  });

  it('Dado likedBy corrupto (no array), cuando alterna like, entonces lo normaliza a array antes de operar', async () => {
    recipe.likedBy = undefined;

    const result = await service.toggleLike('r1', { id: 'u1' } as any);

    Afirmar.que(Array.isArray(result.likedBy)).esIgualA(true);
    Afirmar.que(result.likedBy).esEquivalenteA(['u1']);
  });
});
