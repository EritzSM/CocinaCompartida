import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
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
  comments: [
    { id: 'c1', message: 'Buenisima', user: { id: 'u2', username: 'fan' }, createdAt: new Date() },
  ],
};

const COMMENTS = [
  { id: 'c1', message: 'Buenisima', user: { id: 'u2', username: 'fan' }, createdAt: new Date() },
  { id: 'c2', message: 'Excelente', user: { id: 'u3', username: 'fan2' }, createdAt: new Date() },
];

describe('Ver Comentario Regression Backend', () => {
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

  // Verifica que retorna comentarios cuando la receta existe.
  it('VerComentario_CuandoRecetaExiste_DebeRetornarComentarios', async () => {
    // Arrange
    recipeRepo.findOne.mockResolvedValue({ ...RECIPE });
    commentRepo.find.mockResolvedValue([...COMMENTS]);

    // Act
    const result = await service.findCommentsByRecipe('r1');

    // Assert
    expect(result.length).toBe(2);
    expect(result[0].message).toBe('Buenisima');
  });

  // Verifica que si la receta no existe se lanza NotFound.
  it('VerComentario_CuandoRecetaNoExiste_DebeLanzarNotFound', async () => {
    // Arrange
    recipeRepo.findOne.mockResolvedValue(null);

    // Act
    const action = service.findCommentsByRecipe('missing');

    // Assert
    await expect(action).rejects.toThrow(NotFoundException);
  });

  // Verifica que un fallo del repositorio de comentarios se traduce a error interno.
  it('VerComentario_CuandoRepoComentariosFalla_DebeLanzarInternalServerError', async () => {
    // Arrange
    recipeRepo.findOne.mockResolvedValue({ ...RECIPE });
    commentRepo.find.mockRejectedValue(new Error('db'));

    // Act
    const action = service.findCommentsByRecipe('r1');

    // Assert
    await expect(action).rejects.toThrow(InternalServerErrorException);
  });

  // Verifica que una receta sin comentarios devuelve lista vacia.
  it('VerComentario_CuandoRecetaSinComentarios_DebeRetornarListaVacia', async () => {
    // Arrange
    recipeRepo.findOne.mockResolvedValue({ ...RECIPE, comments: [] });
    commentRepo.find.mockResolvedValue([]);

    // Act
    const result = await service.findCommentsByRecipe('r1');

    // Assert
    expect(result).toEqual([]);
  });
});
