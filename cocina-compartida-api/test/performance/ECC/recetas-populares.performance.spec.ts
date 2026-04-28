import { RecipesService } from '../../../src/recipes/recipes.service';

describe('Recetas Populares Performance Backend', () => {
  // Verifica que el repositorio se consulta una sola vez.
  it('RecetasPopulares_CuandoSeConsulta_DebeLlamarRepositorioUnaSolaVez', async () => {
    // Arrange
    const recipeRepo = { find: jest.fn().mockResolvedValue([]), findOne: jest.fn() };
    const commentRepo = { find: jest.fn(), findOne: jest.fn() };
    const service = new RecipesService(recipeRepo as any, commentRepo as any);

    // Act
    await service.findTopLiked();

    // Assert
    expect(recipeRepo.find).toHaveBeenCalledTimes(1);
  });
});
