import { RecipesService } from '../../../src/recipes/recipes.service';

describe('Eliminar Comentario Performance Backend', () => {
  // Verifica que se consulta y elimina una sola vez.
  it('EliminarComentario_CuandoExiste_DebeConsultarYEliminarUnaSolaVez', async () => {
    // Arrange
    const recipeRepo = { findOne: jest.fn() };
    const commentRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'c1', user: { id: 'u1' } }),
      softRemove: jest.fn().mockResolvedValue(undefined),
    };
    const service = new RecipesService(recipeRepo as any, commentRepo as any);
    const owner = { id: 'u1', username: 'chef' };

    // Act
    await service.removeComment('c1', owner as any);

    // Assert
    expect(commentRepo.findOne).toHaveBeenCalledTimes(1);
    expect(commentRepo.softRemove).toHaveBeenCalledTimes(1);
  });
});
