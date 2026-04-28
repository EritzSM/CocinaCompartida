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

describe('Ver Comentario Performance Backend', () => {
  // Verifica que el servicio consulta cada repositorio una sola vez.
  it('VerComentario_CuandoRecetaExiste_DebeConsultarReposUnaSolaVez', async () => {
    // Arrange
    const recipeRepo = {
      findOne: jest.fn().mockResolvedValue({ ...RECIPE }),
    };
    const commentRepo = {
      find: jest.fn().mockResolvedValue([]),
    };
    const service = new RecipesService(recipeRepo as any, commentRepo as any);

    // Act
    await service.findCommentsByRecipe('r1');

    // Assert
    expect(recipeRepo.findOne).toHaveBeenCalledTimes(1);
    expect(commentRepo.find).toHaveBeenCalledTimes(1);
  });
});
