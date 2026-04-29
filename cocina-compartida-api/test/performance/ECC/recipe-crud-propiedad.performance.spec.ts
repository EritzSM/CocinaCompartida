import { RecipesService } from '../../../src/recipes/recipes.service';
import { Afirmar } from '../../screenplay/fluent/Afirmar';

/**
 * Performance del CRUD: validamos que crear y guardar usen 1 sola
 * llamada a create + 1 sola llamada a save. Asi se evita un repintado
 * de queries por cada propiedad asignada.
 */
describe('Recipe CRUD Propiedad Performance Backend', () => {
  it('Dado una creacion valida, cuando se guarda, entonces ejecuta create x1 y save x1 sin queries extra', async () => {
    const recipeRepo = {
      create: jest.fn((data) => data),
      save: jest.fn(async (data) => ({ id: 'r1', ...data })),
      findOne: jest.fn(),
      find: jest.fn(),
    };
    const commentRepo = { find: jest.fn(), findOne: jest.fn() };
    const service = new RecipesService(recipeRepo as any, commentRepo as any);

    const result = await service.create(
      { name: 'Rapida', descripcion: 'Ok', ingredients: ['a'], steps: ['b'], category: 'cena' },
      { id: 'u1' } as any,
    );

    Afirmar.que(result.id).esIgualA('r1');
    expect(recipeRepo.create).toHaveBeenCalledTimes(1);
    expect(recipeRepo.save).toHaveBeenCalledTimes(1);
    expect(recipeRepo.findOne).not.toHaveBeenCalled();
    expect(recipeRepo.find).not.toHaveBeenCalled();
  });

  it('Dado un update propio, cuando se guarda, entonces ejecuta findOne x1 y save x1 sin redundancias', async () => {
    const recipe = { id: 'r1', user: { id: 'u1' }, name: 'Original' };
    const recipeRepo = {
      findOne: jest.fn().mockResolvedValue(recipe),
      save: jest.fn(async (d) => d),
      create: jest.fn(),
      find: jest.fn(),
    };
    const commentRepo = { find: jest.fn(), findOne: jest.fn() };
    const service = new RecipesService(recipeRepo as any, commentRepo as any);

    await service.update('r1', { name: 'Editada' }, { id: 'u1' } as any);

    expect(recipeRepo.findOne).toHaveBeenCalledTimes(1);
    expect(recipeRepo.save).toHaveBeenCalledTimes(1);
    expect(recipeRepo.find).not.toHaveBeenCalled();
  });
});
