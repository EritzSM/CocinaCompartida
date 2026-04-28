import { RecipesController } from '../../../src/recipes/recipes.controller';
import { RecipesService } from '../../../src/recipes/recipes.service';

describe('Recetas Populares API Backend', () => {
  let controller: RecipesController;
  let recipesService: Partial<RecipesService>;

  beforeEach(() => {
    recipesService = {
      findTopLiked: jest.fn(),
    };
    controller = new RecipesController(recipesService as RecipesService);
  });

  // Verifica que el controlador delega al servicio.
  it('RecetasPopularesApi_CuandoSeConsulta_DebeDelegar', async () => {
    // Arrange
    const data = [{ id: 'r1', likes: 10 }];
    (recipesService.findTopLiked as jest.Mock).mockResolvedValue(data);

    // Act
    const result = await controller.findTopLiked();

    // Assert
    expect(recipesService.findTopLiked).toHaveBeenCalled();
    expect(result).toEqual(data);
  });
});
