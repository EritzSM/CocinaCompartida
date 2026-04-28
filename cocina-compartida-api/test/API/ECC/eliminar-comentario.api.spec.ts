import { ForbiddenException } from '@nestjs/common';
import { RecipesController } from '../../../src/recipes/recipes.controller';
import { RecipesService } from '../../../src/recipes/recipes.service';

describe('Eliminar Comentario API Backend', () => {
  let controller: RecipesController;
  let recipesService: Partial<RecipesService>;

  beforeEach(() => {
    recipesService = {
      removeComment: jest.fn(),
    };
    controller = new RecipesController(recipesService as RecipesService);
  });

  // Verifica que el controlador delega al servicio.
  it('EliminarComentarioApi_CuandoSolicitudValida_DebeDelegar', async () => {
    // Arrange
    const req = { user: { id: 'u1' } };
    (recipesService.removeComment as jest.Mock).mockResolvedValue(undefined);

    // Act
    const result = await controller.deleteComment('c1', req as any);

    // Assert
    expect(recipesService.removeComment).toHaveBeenCalledWith('c1', req.user);
    expect(result).toBeUndefined();
  });

  // Verifica que se propagan errores del servicio.
  it('EliminarComentarioApi_CuandoServicioLanza_DebePropagarError', async () => {
    // Arrange
    const req = { user: { id: 'u1' } };
    (recipesService.removeComment as jest.Mock).mockRejectedValue(new ForbiddenException());

    // Act
    const action = controller.deleteComment('c1', req as any);

    // Assert
    await expect(action).rejects.toThrow(ForbiddenException);
  });
});
