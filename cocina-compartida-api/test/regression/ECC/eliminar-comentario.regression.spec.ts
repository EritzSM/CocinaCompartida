import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RecipesService } from '../../../src/recipes/recipes.service';

describe('Eliminar Comentario Regression Backend', () => {
  let service: RecipesService;
  let recipeRepo: { findOne: jest.Mock };
  let commentRepo: { findOne: jest.Mock; softRemove: jest.Mock };

  const COMMENT = {
    id: 'c1',
    message: 'Buen comentario',
    user: { id: 'u1', username: 'chef' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    recipeRepo = { findOne: jest.fn() };
    commentRepo = { findOne: jest.fn(), softRemove: jest.fn() };
    service = new RecipesService(recipeRepo as any, commentRepo as any);
  });

  // Verifica que el autor puede eliminar su comentario.
  it('EliminarComentario_CuandoEsAutor_DebeEliminar', async () => {
    // Arrange
    commentRepo.findOne.mockResolvedValue({ ...COMMENT });
    commentRepo.softRemove.mockResolvedValue(undefined);
    const owner = { id: 'u1', username: 'chef' };

    // Act
    await service.removeComment('c1', owner as any);

    // Assert
    expect(commentRepo.softRemove).toHaveBeenCalledWith(COMMENT);
  });

  // Verifica que un comentario inexistente lanza NotFound.
  it('EliminarComentario_CuandoNoExiste_DebeLanzarNotFound', async () => {
    // Arrange
    commentRepo.findOne.mockResolvedValue(null);
    const owner = { id: 'u1', username: 'chef' };

    // Act
    const action = service.removeComment('missing', owner as any);

    // Assert
    await expect(action).rejects.toThrow(NotFoundException);
  });

  // Verifica que un usuario distinto no puede eliminar.
  it('EliminarComentario_CuandoNoEsAutor_DebeLanzarForbidden', async () => {
    // Arrange
    commentRepo.findOne.mockResolvedValue({ ...COMMENT });
    const other = { id: 'u2', username: 'other' };

    // Act
    const action = service.removeComment('c1', other as any);

    // Assert
    await expect(action).rejects.toThrow(ForbiddenException);
    expect(commentRepo.softRemove).not.toHaveBeenCalled();
  });
});
