import { NotFoundException } from '@nestjs/common';
import { RecipesService } from '../../../src/recipes/recipes.service';
import { Afirmar } from '../../screenplay/fluent/Afirmar';

describe('Detalle Receta Regression Backend', () => {
  it('Dado una receta existente, cuando se consulta detalle, entonces incluye usuario y comentarios', async () => {
    const recipe = { id: 'r1', ingredients: ['a'], steps: ['b'], user: { id: 'u1' }, comments: [] };
    const recipeRepo = { findOne: jest.fn().mockResolvedValue(recipe), find: jest.fn() };
    const commentRepo = { find: jest.fn(), findOne: jest.fn() };
    const service = new RecipesService(recipeRepo as any, commentRepo as any);

    const result = await service.findOne('r1');

    Afirmar.que(result).esEquivalenteA(recipe as any);
    expect(recipeRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ relations: ['user', 'comments', 'comments.user'] }),
    );
  });

  it('Dado una receta inexistente, cuando se consulta detalle, entonces lanza NotFound', async () => {
    const recipeRepo = { findOne: jest.fn().mockResolvedValue(null), find: jest.fn() };
    const commentRepo = { find: jest.fn(), findOne: jest.fn() };
    const service = new RecipesService(recipeRepo as any, commentRepo as any);

    await Afirmar.que(service.findOne('no-existe')).rechazaCon(NotFoundException);
  });
});
