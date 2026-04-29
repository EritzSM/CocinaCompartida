import { RecipesService } from '../../../src/recipes/recipes.service';
import { Afirmar } from '../../screenplay/fluent/Afirmar';

/**
 * Pruebas de "performance" del backend en clave de ESFUERZO de I/O.
 * No se mide tiempo contra mocks (eso seria mentir). Se valida que el
 * service no genere queries adicionales (proteccion contra N+1) y que
 * use options de query optimizadas (relaciones, order, take).
 */
describe('Explorar Recetas Performance Backend', () => {
  it('Dado el listado publico, cuando se consulta findAll, entonces ejecuta 1 sola query con relations y order DESC', async () => {
    const recipeRepo = { find: jest.fn().mockResolvedValue([]), findOne: jest.fn() };
    const commentRepo = { find: jest.fn(), findOne: jest.fn() };
    const service = new RecipesService(recipeRepo as any, commentRepo as any);

    await service.findAll();

    Afirmar.que(recipeRepo.find).fueLlamado();
    expect(recipeRepo.find).toHaveBeenCalledTimes(1);
    expect(recipeRepo.findOne).not.toHaveBeenCalled();
    expect(recipeRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        relations: ['user', 'comments', 'comments.user'],
        order: { createdAt: 'DESC' },
      }),
    );
  });

  it('Dado top liked, cuando se consulta, entonces aplica take y orden por likes DESC', async () => {
    const recipeRepo = { find: jest.fn().mockResolvedValue([]), findOne: jest.fn() };
    const commentRepo = { find: jest.fn(), findOne: jest.fn() };
    const service = new RecipesService(recipeRepo as any, commentRepo as any);

    await service.findTopLiked(3);

    expect(recipeRepo.find).toHaveBeenCalledTimes(1);
    expect(recipeRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        order: { likes: 'DESC', createdAt: 'DESC' },
        take: 3,
      }),
    );
  });
});
