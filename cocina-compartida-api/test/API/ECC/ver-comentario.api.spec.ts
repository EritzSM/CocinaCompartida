import { NotFoundException } from '@nestjs/common';
import { RecipesController } from '../../../src/recipes/recipes.controller';
import { RecipesService } from '../../../src/recipes/recipes.service';

describe('Ver Comentario API Backend', () => {
  let controller: RecipesController;
  let recipesService: Partial<RecipesService>;

  beforeEach(() => {
    recipesService = {
      findCommentsByRecipe: jest.fn(),
    };
    controller = new RecipesController(recipesService as RecipesService);
  });

  // Verifica que el controlador devuelve comentarios cuando el servicio responde OK.
  it('VerComentarioApi_CuandoServicioResponde_DebeRetornarComentarios', async () => {
    // Arrange
    const comments = [
      { id: 'c1', message: 'Buenisima', user: { id: 'u1', username: 'fan' } },
      { id: 'c2', message: 'Excelente', user: { id: 'u2', username: 'fan2' } },
    ];
    (recipesService.findCommentsByRecipe as jest.Mock).mockResolvedValue(comments);

    // Act
    const result = await controller.listComments('r1');

    // Assert
    expect(recipesService.findCommentsByRecipe).toHaveBeenCalledWith('r1');
    expect(result).toEqual(comments);
  });

  // Verifica que se propaga NotFound si el servicio lo lanza.
  it('VerComentarioApi_CuandoServicioLanzaNotFound_DebePropagarNotFound', async () => {
    // Arrange
    (recipesService.findCommentsByRecipe as jest.Mock).mockRejectedValue(new NotFoundException());

    // Act
    const action = controller.listComments('missing');

    // Assert
    await expect(action).rejects.toThrow(NotFoundException);
  });
});
