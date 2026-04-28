import { BadRequestException } from '@nestjs/common';
import { RecipesService } from '../../../src/recipes/recipes.service';

describe('Recetas Populares Security Backend', () => {
  it('RecetasPopulares_CuandoLimitCero_DebeLanzarBadRequest', async () => {
    // Arrange
    const recipeRepo = { find: jest.fn(), findOne: jest.fn() };
    const commentRepo = { find: jest.fn(), findOne: jest.fn() };
    const service = new RecipesService(recipeRepo as any, commentRepo as any);

    // Act
    const action = service.findTopLiked(0);

    // Assert
    await expect(action).rejects.toThrow(BadRequestException);
    expect(recipeRepo.find).not.toHaveBeenCalled();
  });

  it('RecetasPopulares_CuandoLimitNegativo_DebeLanzarBadRequest', async () => {
    // Arrange
    const recipeRepo = { find: jest.fn(), findOne: jest.fn() };
    const commentRepo = { find: jest.fn(), findOne: jest.fn() };
    const service = new RecipesService(recipeRepo as any, commentRepo as any);

    // Act
    const action = service.findTopLiked(-1);

    // Assert
    await expect(action).rejects.toThrow(BadRequestException);
    expect(recipeRepo.find).not.toHaveBeenCalled();
  });
});
