import { RecipesService } from '../../../src/recipes/recipes.service';
import { Afirmar } from '../../screenplay/fluent/Afirmar';

describe('Explorar Recetas Regression Backend', () => {
  it('Dado recetas existentes, cuando se listan, entonces conserva orden descendente por createdAt configurado', async () => {
    const recipes = [{ id: 'r2' }, { id: 'r1' }];
    const recipeRepo = { find: jest.fn().mockResolvedValue(recipes), findOne: jest.fn() };
    const commentRepo = { find: jest.fn(), findOne: jest.fn() };
    const service = new RecipesService(recipeRepo as any, commentRepo as any);

    const result = await service.findAll();

    Afirmar.que(result).esEquivalenteA(recipes);
    expect(recipeRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ order: { createdAt: 'DESC' } }),
    );
  });
});
