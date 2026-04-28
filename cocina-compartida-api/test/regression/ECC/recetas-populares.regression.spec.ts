import { BadRequestException } from '@nestjs/common';
import { RecipesService } from '../../../src/recipes/recipes.service';

describe('Recetas Populares Regression Backend', () => {
  let service: RecipesService;
  let recipeRepo: { find: jest.Mock; findOne: jest.Mock };
  let commentRepo: { find: jest.Mock; findOne: jest.Mock };

  beforeEach(() => {
    recipeRepo = { find: jest.fn(), findOne: jest.fn() };
    commentRepo = { find: jest.fn(), findOne: jest.fn() };
    service = new RecipesService(recipeRepo as any, commentRepo as any);
  });

  // Verifica que retorna recetas cuando existen.
  it('RecetasPopulares_CuandoHayRecetas_DebeRetornarLista', async () => {
    // Arrange
    const recipes = [{ id: 'r1', likes: 10 }, { id: 'r2', likes: 5 }];
    recipeRepo.find.mockResolvedValue(recipes as any);

    // Act
    const result = await service.findTopLiked();

    // Assert
    expect(result).toEqual(recipes as any);
  });

  // Verifica que limit <= 0 lanza BadRequest.
  it('RecetasPopulares_CuandoLimitInvalido_DebeLanzarBadRequest', async () => {
    // Arrange
    const action = service.findTopLiked(0);

    // Act & Assert
    await expect(action).rejects.toThrow(BadRequestException);
  });
});
