import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RecipesService } from '../../../src/recipes/recipes.service';

describe('Eliminar Comentario Security Backend', () => {
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

  it('EliminarComentario_CuandoNoEsAutor_DebeLanzarForbidden', async () => {
    // Arrange
    commentRepo.findOne.mockResolvedValue({ ...COMMENT });
    const otherUser = { id: 'u2', username: 'other' };

    // Act
    const action = service.removeComment('c1', otherUser as any);

    // Assert
    await expect(action).rejects.toThrow(ForbiddenException);
    expect(commentRepo.softRemove).not.toHaveBeenCalled();
  });

  it('EliminarComentario_CuandoCommentNoExiste_DebeLanzarNotFound', async () => {
    // Arrange
    commentRepo.findOne.mockResolvedValue(null);
    const owner = { id: 'u1', username: 'chef' };

    // Act
    const action = service.removeComment('missing', owner as any);

    // Assert
    await expect(action).rejects.toThrow(NotFoundException);
    expect(commentRepo.softRemove).not.toHaveBeenCalled();
  });
});
