import { RecipesService } from '../recipes/recipes.service';
import { NotFoundException } from '@nestjs/common';

describe('RecipesService – Comentarios (createComment)', () => {
  let service: RecipesService;
  let recipeRepo: any;
  let commentRepo: any;

  beforeEach(() => {
    // Arrange global: mocks de repositorios TypeORM
    recipeRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    commentRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      softRemove: jest.fn(),
    };
    service = new RecipesService(recipeRepo, commentRepo);
  });

  // ──────────────────────────────────────────────────────────
  // C-01: Comentario válido + JWT → Comentario creado – 201
  // ──────────────────────────────────────────────────────────
  describe('C-01 – Comentario válido creado exitosamente', () => {
    it('debe crear y retornar el comentario cuando los datos son válidos', async () => {
      // Arrange
      const recipeId = 'uuid-recipe';
      const createCommentDto = { message: 'Excelente receta, muy fácil de seguir!' };
      const user = { id: 'uuid-user', username: 'comentador', email: 'user@email.com' } as any;
      const mockRecipe = {
        id: recipeId,
        name: 'Tacos',
        user: { id: 'uuid-owner' },
        comments: [],
      };
      const savedComment = {
        id: 'uuid-comment',
        message: 'Excelente receta, muy fácil de seguir!',
        user,
        recipe: mockRecipe,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      recipeRepo.findOne.mockResolvedValue(mockRecipe);
      commentRepo.create.mockReturnValue(savedComment);
      commentRepo.save.mockResolvedValue(savedComment);

      // Act
      const result = await service.createComment(recipeId, createCommentDto, user);

      // Assert
      expect(recipeRepo.findOne).toHaveBeenCalledWith({
        where: { id: recipeId },
        relations: ['user', 'comments', 'comments.user'],
      });
      expect(commentRepo.create).toHaveBeenCalledWith({
        ...createCommentDto,
        user,
        recipe: mockRecipe,
      });
      expect(commentRepo.save).toHaveBeenCalledWith(savedComment);
      expect(result).toEqual(savedComment);
      expect(result.message).toBe('Excelente receta, muy fácil de seguir!');
    });
  });

  // ──────────────────────────────────────────────────────────
  // C-02: Comentario vacío → Error 400 (validación de DTO)
  // ──────────────────────────────────────────────────────────
  describe('C-02 – Comentario vacío', () => {
    it('si se pasa un comentario con mensaje vacío, el servicio lo procesa (la validación es del DTO)', async () => {
      // Arrange
      const recipeId = 'uuid-recipe';
      const createCommentDto = { message: '' };
      const user = { id: 'uuid-user', username: 'user' } as any;
      const mockRecipe = {
        id: recipeId,
        name: 'Pizza',
        user: { id: 'uuid-owner' },
        comments: [],
      };
      const savedComment = {
        id: 'uuid-empty-comment',
        message: '',
        user,
        recipe: mockRecipe,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      recipeRepo.findOne.mockResolvedValue(mockRecipe);
      commentRepo.create.mockReturnValue(savedComment);
      commentRepo.save.mockResolvedValue(savedComment);

      // Act
      const result = await service.createComment(recipeId, createCommentDto, user);

      // Assert
      // NOTA: La validación del campo message vacío es responsabilidad del DTO
      // con @IsNotEmpty(). A nivel del servicio, no hay validación de contenido.
      expect(commentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ message: '' }),
      );
      expect(result.message).toBe('');
    });
  });

  // ──────────────────────────────────────────────────────────
  // C-04: Receta inexistente → Error 404
  // ──────────────────────────────────────────────────────────
  describe('C-04 – Receta inexistente', () => {
    it('debe lanzar NotFoundException si la receta no existe', async () => {
      // Arrange
      const recipeId = 'uuid-no-existe';
      const createCommentDto = { message: 'Comentario en receta fantasma' };
      const user = { id: 'uuid-user', username: 'user' } as any;
      recipeRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createComment(recipeId, createCommentDto, user),
      ).rejects.toThrow(NotFoundException);
    });

    it('no debe intentar crear el comentario si la receta no existe', async () => {
      // Arrange
      const recipeId = 'uuid-no-existe';
      const createCommentDto = { message: 'Comentario' };
      const user = { id: 'uuid-user' } as any;
      recipeRepo.findOne.mockResolvedValue(null);

      // Act
      try {
        await service.createComment(recipeId, createCommentDto, user);
      } catch {}

      // Assert
      expect(commentRepo.create).not.toHaveBeenCalled();
      expect(commentRepo.save).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────
  // Camino adicional: Listar comentarios de una receta
  // ──────────────────────────────────────────────────────────
  describe('Camino adicional – Listar comentarios por receta', () => {
    it('debe retornar los comentarios de una receta existente', async () => {
      // Arrange
      const recipeId = 'uuid-recipe-comments';
      const mockRecipe = { id: recipeId, name: 'Tacos' };
      const mockComments = [
        { id: 'c1', message: 'Delicioso!', user: { id: 'u1', username: 'user1' }, createdAt: new Date() },
        { id: 'c2', message: 'Muy bueno', user: { id: 'u2', username: 'user2' }, createdAt: new Date() },
      ];
      recipeRepo.findOne.mockResolvedValue(mockRecipe);
      commentRepo.find.mockResolvedValue(mockComments);

      // Act
      const result = await service.findCommentsByRecipe(recipeId);

      // Assert
      expect(result).toHaveLength(2);
      expect(commentRepo.find).toHaveBeenCalledWith({
        where: { recipe: { id: recipeId } },
        relations: ['user'],
        order: { createdAt: 'ASC' },
      });
    });

    it('debe retornar lista vacía si la receta no tiene comentarios', async () => {
      // Arrange
      const recipeId = 'uuid-recipe-empty';
      recipeRepo.findOne.mockResolvedValue({ id: recipeId, name: 'Sushi' });
      commentRepo.find.mockResolvedValue([]);

      // Act
      const result = await service.findCommentsByRecipe(recipeId);

      // Assert
      expect(result).toEqual([]);
    });

    it('debe lanzar NotFoundException si se listan comentarios de receta inexistente', async () => {
      // Arrange
      const recipeId = 'uuid-no-existe';
      recipeRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findCommentsByRecipe(recipeId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ──────────────────────────────────────────────────────────
  // Camino adicional: Eliminar comentario
  // ──────────────────────────────────────────────────────────
  describe('Camino adicional – Eliminar comentario', () => {
    it('debe eliminar un comentario propio', async () => {
      // Arrange
      const commentId = 'uuid-comment';
      const user = { id: 'uuid-owner' } as any;
      const mockComment = {
        id: commentId,
        message: 'Mi comentario',
        user: { id: 'uuid-owner' },
      };
      commentRepo.findOne.mockResolvedValue(mockComment);
      commentRepo.softRemove.mockResolvedValue(undefined);

      // Act
      await service.removeComment(commentId, user);

      // Assert
      expect(commentRepo.softRemove).toHaveBeenCalledWith(mockComment);
    });

    it('debe lanzar NotFoundException si el comentario no existe', async () => {
      // Arrange
      const commentId = 'uuid-no-comment';
      const user = { id: 'uuid-user' } as any;
      commentRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.removeComment(commentId, user)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar ForbiddenException si intenta eliminar un comentario ajeno', async () => {
      // Arrange
      const commentId = 'uuid-comment-ajeno';
      const user = { id: 'uuid-otro-user' } as any;
      const mockComment = {
        id: commentId,
        message: 'Comentario de otro',
        user: { id: 'uuid-owner-comment' },
      };
      commentRepo.findOne.mockResolvedValue(mockComment);

      // Act & Assert
      const { ForbiddenException } = require('@nestjs/common');
      await expect(service.removeComment(commentId, user)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
