import { RecipesService } from '../../../src/recipes/recipes.service';
import { Afirmar } from '../../screenplay/fluent/Afirmar';

/**
 * Performance de toggle like: validamos que cada operacion solo dispara
 * findOne x1 y save x1, evitando overhead de queries repetidas o
 * recargas innecesarias del agregado.
 */
describe('Favoritos Bookmarks Performance Backend', () => {
  it('Dado una receta, cuando se alterna favorito por primera vez, entonces hace findOne x1 y save x1', async () => {
    const recipe = { id: 'r1', likedBy: [], likes: 0, user: { id: 'owner' } };
    const recipeRepo = {
      findOne: jest.fn().mockResolvedValue(recipe),
      save: jest.fn(async (d) => d),
      find: jest.fn(),
    };
    const commentRepo = { find: jest.fn(), findOne: jest.fn() };
    const service = new RecipesService(recipeRepo as any, commentRepo as any);

    const result = await service.toggleLike('r1', { id: 'u1' } as any);

    Afirmar.que(result.likedBy).esEquivalenteA(['u1']);
    expect(recipeRepo.findOne).toHaveBeenCalledTimes(1);
    expect(recipeRepo.save).toHaveBeenCalledTimes(1);
    expect(recipeRepo.find).not.toHaveBeenCalled();
  });

  it('Dado dos toggles consecutivos, cuando se procesan, entonces el conteo de queries crece linealmente sin N+1', async () => {
    const recipe = { id: 'r1', likedBy: [], likes: 0, user: { id: 'owner' } };
    const recipeRepo = {
      findOne: jest.fn().mockResolvedValue(recipe),
      save: jest.fn(async (d) => d),
      find: jest.fn(),
    };
    const commentRepo = { find: jest.fn(), findOne: jest.fn() };
    const service = new RecipesService(recipeRepo as any, commentRepo as any);

    await service.toggleLike('r1', { id: 'u1' } as any);
    await service.toggleLike('r1', { id: 'u2' } as any);

    expect(recipeRepo.findOne).toHaveBeenCalledTimes(2);
    expect(recipeRepo.save).toHaveBeenCalledTimes(2);
  });
});
