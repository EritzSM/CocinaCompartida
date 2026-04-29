import { RecipesService } from '../../../src/recipes/recipes.service';
import { Afirmar } from '../../screenplay/fluent/Afirmar';

/**
 * Performance del detalle: en lugar de medir tiempo contra mocks (irreal),
 * se asegura que findOne no genere queries adicionales y que pida las
 * relaciones necesarias en una sola consulta (sin lazy/N+1).
 */
describe('Detalle Receta Performance Backend', () => {
  it('Dado una receta existente, cuando se consulta detalle, entonces ejecuta 1 sola query con todas las relaciones', async () => {
    const recipe = { id: 'r1', user: { id: 'u1' }, comments: [] };
    const recipeRepo = {
      findOne: jest.fn().mockResolvedValue(recipe),
      find: jest.fn(),
    };
    const commentRepo = { find: jest.fn(), findOne: jest.fn() };
    const service = new RecipesService(recipeRepo as any, commentRepo as any);

    const result = await service.findOne('r1');

    Afirmar.que(result.id).esIgualA('r1');
    expect(recipeRepo.findOne).toHaveBeenCalledTimes(1);
    expect(recipeRepo.find).not.toHaveBeenCalled();
    expect(recipeRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'r1' },
        relations: ['user', 'comments', 'comments.user'],
      }),
    );
  });
});
