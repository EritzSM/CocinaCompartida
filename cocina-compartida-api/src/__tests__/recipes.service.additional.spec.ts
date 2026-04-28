import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { RecipesService } from '../recipes/recipes.service';
import { User } from '../user/entities/user.entity';

describe('RecipesService Additional Coverage', () => {
  let service: RecipesService;
  let recipeRepo: { find: jest.Mock; findOne: jest.Mock; save: jest.Mock; create: jest.Mock; remove: jest.Mock };
  let commentRepo: { find: jest.Mock; findOne: jest.Mock; softRemove: jest.Mock; create: jest.Mock; save: jest.Mock };

  beforeEach(() => {
    recipeRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    };
    commentRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      softRemove: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    service = new RecipesService(recipeRepo as any, commentRepo as any);
  });

  it('FindAll_CuandoHayRecetas_DebeRetornarListaConRelaciones', async () => {
    // Arrange
    const recipes = [{ id: 'r1' }, { id: 'r2' }];
    recipeRepo.find.mockResolvedValue(recipes);

    // Act
    const result = await service.findAll();

    // Assert
    expect(recipeRepo.find).toHaveBeenCalledWith({
      relations: ['user', 'comments', 'comments.user'],
      order: { createdAt: 'DESC' },
    });
    expect(result).toEqual(recipes);
  });

  it('FindByTag_CuandoTagExiste_DebeFiltrarPorTag', async () => {
    // Arrange
    const recipes = [
      { id: 'r1', tags: ['veg', 'quick'] },
      { id: 'r2', tags: ['meat'] },
      { id: 'r3', tags: undefined },
      { id: 'r4', tags: ['veg'] },
    ];
    recipeRepo.find.mockResolvedValue(recipes);

    // Act
    const result = await service.findByTag('veg');

    // Assert
    expect(recipeRepo.find).toHaveBeenCalledWith({
      relations: ['user', 'comments', 'comments.user'],
    });
    expect(result.map(r => r.id)).toEqual(['r1', 'r4']);
  });

  it('FindTopLiked_CuandoRepositorioFalla_DebeLanzarInternalServerError', async () => {
    // Arrange
    recipeRepo.find.mockRejectedValue(new Error('db'));

    // Act
    const action = service.findTopLiked();

    // Assert
    await expect(action).rejects.toThrow(InternalServerErrorException);
  });

  it('FindCommentsByRecipe_CuandoRepoComentariosFalla_DebeLanzarInternalServerError', async () => {
    // Arrange
    recipeRepo.findOne.mockResolvedValue({ id: 'r1', user: { id: 'u1' } });
    commentRepo.find.mockRejectedValue(new Error('db'));

    // Act
    const action = service.findCommentsByRecipe('r1');

    // Assert
    await expect(action).rejects.toThrow(InternalServerErrorException);
  });

  it('RemoveComment_CuandoSoftRemoveFalla_DebeLanzarConflict', async () => {
    // Arrange
    const user = { id: 'u1' } as User;
    const comment = { id: 'c1', user: { id: 'u1' } };
    commentRepo.findOne.mockResolvedValue(comment);
    commentRepo.softRemove.mockRejectedValue(new Error('db'));

    // Act
    const action = service.removeComment('c1', user);

    // Assert
    await expect(action).rejects.toThrow(ConflictException);
  });
});
