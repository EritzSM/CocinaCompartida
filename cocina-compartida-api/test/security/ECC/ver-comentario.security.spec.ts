import { NotFoundException } from '@nestjs/common';
import { RecipesService } from '../../../src/recipes/recipes.service';

const RECIPE = {
  id: 'r1',
  name: 'Pasta',
  descripcion: 'desc',
  ingredients: ['pasta'],
  steps: ['cocinar'],
  images: [],
  category: 'Italiana',
  likes: 0,
  likedBy: [],
  user: { id: 'u1', username: 'chef' },
  comments: [],
};

describe('Ver Comentario Security Backend', () => {
  let service: RecipesService;
  let recipeRepo: { findOne: jest.Mock };
  let commentRepo: { find: jest.Mock };

  beforeEach(() => {
    recipeRepo = {
      findOne: jest.fn(),
    };
    commentRepo = {
      find: jest.fn(),
    };
    service = new RecipesService(recipeRepo as any, commentRepo as any);
  });

  // Verifica que los comentarios se filtran por id de receta.
  it('VerComentario_CuandoRecetaExiste_DebeFiltrarComentariosPorId', async () => {
    // Arrange
    recipeRepo.findOne.mockResolvedValue({ ...RECIPE });
    commentRepo.find.mockResolvedValue([]);

    // Act
    await service.findCommentsByRecipe('r1');

    // Assert
    expect(commentRepo.find).toHaveBeenCalledWith({
      where: { recipe: { id: 'r1' } },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  });

  // Verifica que sin receta no se consulta el repositorio de comentarios.
  it('VerComentario_CuandoRecetaNoExiste_NoDebeConsultarComentarios', async () => {
    // Arrange
    recipeRepo.findOne.mockResolvedValue(null);

    // Act
    const action = service.findCommentsByRecipe('missing');

    // Assert
    await expect(action).rejects.toThrow(NotFoundException);
    expect(commentRepo.find).not.toHaveBeenCalled();
  });
});
