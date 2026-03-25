/**
 * Recipe Detail – Pruebas del servicio findOne()
 *
 * Tipo de mocks usados en este archivo:
 *   - Stub : recipeRepo.findOne retornando null → provoca NotFoundException
 *   - Spy  : jest.spyOn para observar llamadas al repositorio sin cambiar comportamiento
 */
import { RecipesService } from '../recipes/recipes.service';
import { NotFoundException } from '@nestjs/common';

describe('RecipesService – Recipe Detail (findOne)', () => {
  let service: RecipesService;
  let recipeRepo: any;
  let commentRepo: any;

  beforeEach(() => {
    // Arrange global
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
    };
    service = new RecipesService(recipeRepo, commentRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────
  // RD-01: findOne retorna receta existente con relaciones
  // ──────────────────────────────────────────────────────────
  describe('RD-01 – findOne retorna la receta completa cuando existe', () => {
    it('debe retornar la receta con todas sus relaciones cargadas', async () => {
      // Arrange – Spy: observamos sin cambiar el comportamiento
      const recipeId = 'uuid-recipe-paella';
      const mockRecipe = {
        id: recipeId,
        name: 'Paella',
        descripcion: 'Receta tradicional valenciana',
        ingredients: ['arroz', 'mariscos', 'azafrán'],
        steps: ['sofreír', 'añadir caldo', 'cocinar'],
        images: ['http://img.example.com/paella.jpg'],
        likes: 10,
        likedBy: ['u1', 'u2'],
        tags: ['española', 'tradicional'],
        user: { id: 'u1', username: 'chef_valencia' },
        comments: [{ id: 'c1', message: 'Deliciosa' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const findOneSpy = jest.spyOn(recipeRepo, 'findOne').mockResolvedValue(mockRecipe);

      // Act
      const result = await service.findOne(recipeId);

      // Assert
      expect(result).toEqual(mockRecipe);
      expect(findOneSpy).toHaveBeenCalledTimes(1);
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: recipeId },
        relations: ['user', 'comments', 'comments.user'],
      });
    });
  });

  // ──────────────────────────────────────────────────────────
  // RD-02: findOne lanza NotFoundException si la receta no existe
  // ──────────────────────────────────────────────────────────
  describe('RD-02 – findOne lanza 404 si la receta no existe', () => {
    it('debe lanzar NotFoundException con mensaje descriptivo cuando el ID no existe', async () => {
      // Arrange – Stub: retorna null incondicionalmente
      const nonExistentId = 'id-fantasma-00000';
      recipeRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(nonExistentId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(nonExistentId)).rejects.toThrow(
        `Recipe with ID "${nonExistentId}" not found`,
      );
    });

    it('no debe hacer operaciones adicionales cuando la receta no existe', async () => {
      // Arrange – Stub
      recipeRepo.findOne.mockResolvedValue(null);

      // Act
      try {
        await service.findOne('id-no-existe');
      } catch {}

      // Assert
      expect(recipeRepo.save).not.toHaveBeenCalled();
      expect(recipeRepo.remove).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────
  // RD-03: findOne llama al repositorio con los parámetros correctos
  // ──────────────────────────────────────────────────────────
  describe('RD-03 – findOne pasa los parámetros correctos al repositorio', () => {
    it('debe llamar a findOne del repositorio con where e id correcto', async () => {
      // Arrange – Spy
      const recipeId = 'uuid-test-rd03';
      const mockRecipe = {
        id: recipeId,
        name: 'Ceviche',
        user: { id: 'u5' },
        comments: [],
      };
      const findOneSpy = jest.spyOn(recipeRepo, 'findOne').mockResolvedValue(mockRecipe);

      // Act
      await service.findOne(recipeId);

      // Assert
      expect(findOneSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: recipeId },
          relations: expect.arrayContaining(['user', 'comments', 'comments.user']),
        }),
      );
    });
  });

  // ──────────────────────────────────────────────────────────
  // RD-04: findOne retorna exactamente la receta del repositorio
  // ──────────────────────────────────────────────────────────
  describe('RD-04 – findOne retorna el objeto sin modificaciones', () => {
    it('debe retornar la referencia exacta del objeto que devuelve el repositorio', async () => {
      // Arrange – Stub
      const recipeId = 'uuid-rd04';
      const originalRecipe = {
        id: recipeId,
        name: 'Tamales',
        tags: ['mexicana'],
        user: { id: 'u6' },
        comments: [],
      };
      recipeRepo.findOne.mockResolvedValue(originalRecipe);

      // Act
      const result = await service.findOne(recipeId);

      // Assert
      expect(result).toBe(originalRecipe); // misma referencia, no copia
      expect(result.name).toBe('Tamales');
    });
  });
});
