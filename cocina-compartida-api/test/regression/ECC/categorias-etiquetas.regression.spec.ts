import { RecipesService } from '../../../src/recipes/recipes.service';
import { Afirmar } from '../../screenplay/fluent/Afirmar';

describe('Categorias y Etiquetas Regression Backend', () => {
  it('Dado una edicion de categoria, cuando se guarda, entonces la categoria queda actualizada', async () => {
    const recipe = { id: 'r1', category: 'desayuno', user: { id: 'owner' } };
    const recipeRepo = {
      findOne: jest.fn().mockResolvedValue(recipe),
      save: jest.fn(async (data) => data),
      find: jest.fn(),
    };
    const service = new RecipesService(recipeRepo as any, { find: jest.fn(), findOne: jest.fn() } as any);

    const result = await service.update('r1', { category: 'cena' }, { id: 'owner' } as any);

    Afirmar.que(result.category).esIgualA('cena');
  });

  it('Dado varias etiquetas, cuando se filtra por tag, entonces no mezcla categorias no relacionadas', async () => {
    const recipes = [
      { id: 'r1', tags: ['desayuno'] },
      { id: 'r2', tags: ['cena', 'saludable'] },
      { id: 'r3', tags: [] },
    ];
    const recipeRepo = { find: jest.fn().mockResolvedValue(recipes), findOne: jest.fn() };
    const service = new RecipesService(recipeRepo as any, { find: jest.fn(), findOne: jest.fn() } as any);

    const result = await service.findByTag('cena');

    Afirmar.que(result).esEquivalenteA([recipes[1]]);
  });
});
