import { RecipesService } from '../recipes/recipes.service';
import { NotFoundException } from '@nestjs/common';

describe('RecipesService – Recetas Populares (findTopLiked)', () => {
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
    };
    service = new RecipesService(recipeRepo, commentRepo);
  });

  // ──────────────────────────────────────────────────────────
  // RP-01: Recetas con diferentes likes → ordenadas descendente
  // ──────────────────────────────────────────────────────────
  describe('RP-01 – Recetas ordenadas por likes descendente', () => {
    it('debe retornar recetas ordenadas de mayor a menor según número de likes', async () => {
      // Arrange
      const mockRecipes = [
        { id: 'r1', name: 'Tacos', likes: 100, descripcion: 'Tacos al pastor', ingredients: ['tortilla'], steps: ['cocinar'], images: [], likedBy: [], createdAt: new Date(), updatedAt: new Date(), user: { id: 'u1', username: 'chef1' }, comments: [] },
        { id: 'r2', name: 'Pizza', likes: 50, descripcion: 'Pizza napolitana', ingredients: ['masa'], steps: ['hornear'], images: [], likedBy: [], createdAt: new Date(), updatedAt: new Date(), user: { id: 'u2', username: 'chef2' }, comments: [] },
        { id: 'r3', name: 'Sushi', likes: 25, descripcion: 'Sushi roll', ingredients: ['arroz'], steps: ['enrollar'], images: [], likedBy: [], createdAt: new Date(), updatedAt: new Date(), user: { id: 'u3', username: 'chef3' }, comments: [] },
      ];
      recipeRepo.find.mockResolvedValue(mockRecipes);

      // Act
      const result = await service.findTopLiked();

      // Assert
      expect(recipeRepo.find).toHaveBeenCalledWith({
        relations: ['user', 'comments', 'comments.user'],
        order: { likes: 'DESC', createdAt: 'DESC' },
        take: 3,
      });
      expect(result).toHaveLength(3);
      expect(result[0].likes).toBeGreaterThanOrEqual(result[1].likes);
      expect(result[1].likes).toBeGreaterThanOrEqual(result[2].likes);
    });
  });

  // ──────────────────────────────────────────────────────────
  // RP-02: No existen recetas → lista vacía
  // ──────────────────────────────────────────────────────────
  describe('RP-02 – No existen recetas registradas', () => {
    it('debe retornar lista vacía cuando no hay recetas', async () => {
      // Arrange
      recipeRepo.find.mockResolvedValue([]);

      // Act
      const result = await service.findTopLiked();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────────────────
  // RP-04: Recetas con igual número de likes
  // ──────────────────────────────────────────────────────────
  describe('RP-04 – Recetas con igual número de likes', () => {
    it('debe mostrar todas las recetas sin error manteniendo orden consistente', async () => {
      // Arrange
      const mockRecipes = [
        { id: 'r1', name: 'Tacos', likes: 10, createdAt: new Date('2025-01-03'), user: { id: 'u1' }, comments: [] },
        { id: 'r2', name: 'Pizza', likes: 10, createdAt: new Date('2025-01-02'), user: { id: 'u2' }, comments: [] },
        { id: 'r3', name: 'Sushi', likes: 10, createdAt: new Date('2025-01-01'), user: { id: 'u3' }, comments: [] },
      ];
      recipeRepo.find.mockResolvedValue(mockRecipes);

      // Act
      const result = await service.findTopLiked();

      // Assert
      expect(result).toHaveLength(3);
      // Todos tienen el mismo número de likes
      expect(result[0].likes).toEqual(result[1].likes);
      expect(result[1].likes).toEqual(result[2].likes);
      // Se ordenan por createdAt DESC como segundo criterio
      expect(recipeRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { likes: 'DESC', createdAt: 'DESC' },
        }),
      );
    });
  });

  // ──────────────────────────────────────────────────────────
  // RP-05: Validación de estructura de respuesta
  // ──────────────────────────────────────────────────────────
  describe('RP-05 – Estructura de respuesta', () => {
    it('cada receta debe contener los campos esperados (id, name, likes, descripcion, etc.)', async () => {
      // Arrange
      const mockRecipe = {
        id: 'r1',
        name: 'Paella',
        likes: 42,
        descripcion: 'Paella valenciana',
        ingredients: ['arroz', 'mariscos'],
        steps: ['sofreír', 'hervir'],
        images: ['http://img.com/paella.jpg'],
        likedBy: ['u1', 'u2'],
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 'u1', username: 'chef' },
        comments: [],
      };
      recipeRepo.find.mockResolvedValue([mockRecipe]);

      // Act
      const result = await service.findTopLiked();

      // Assert
      expect(result).toHaveLength(1);
      const recipe = result[0];
      expect(recipe).toHaveProperty('id');
      expect(recipe).toHaveProperty('name');
      expect(recipe).toHaveProperty('likes');
      expect(recipe).toHaveProperty('descripcion');
      expect(recipe).toHaveProperty('ingredients');
      expect(recipe).toHaveProperty('steps');
      expect(recipe).toHaveProperty('images');
      expect(recipe).toHaveProperty('user');
      expect(recipe).toHaveProperty('comments');
      expect(recipe).toHaveProperty('createdAt');
    });
  });

  // ──────────────────────────────────────────────────────────
  // RP-06: Alta cantidad de registros → responde correctamente
  // ──────────────────────────────────────────────────────────
  describe('RP-06 – Alta cantidad de registros', () => {
    it('debe responder correctamente sin error con muchos registros', async () => {
      // Arrange
      const mockRecipes = Array.from({ length: 3 }, (_, i) => ({
        id: `r-${i}`,
        name: `Receta ${i}`,
        likes: 100 - i,
        descripcion: `Descripción ${i}`,
        ingredients: [],
        steps: [],
        images: [],
        likedBy: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: `u-${i}`, username: `chef${i}` },
        comments: [],
      }));
      recipeRepo.find.mockResolvedValue(mockRecipes);

      // Act
      const result = await service.findTopLiked();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].likes).toBeGreaterThanOrEqual(result[1].likes);
    });

    it('debe respetar el límite pasado como parámetro', async () => {
      // Arrange
      const limit = 5;
      recipeRepo.find.mockResolvedValue([]);

      // Act
      await service.findTopLiked(limit);

      // Assert
      expect(recipeRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });
  });

  // ──────────────────────────────────────────────────────────
  // Camino adicional: findTopLiked usa limit por defecto = 3
  // ──────────────────────────────────────────────────────────
  describe('Camino adicional – Límite por defecto', () => {
    it('debe usar take: 3 como límite por defecto', async () => {
      // Arrange
      recipeRepo.find.mockResolvedValue([]);

      // Act
      await service.findTopLiked();

      // Assert
      expect(recipeRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 3 }),
      );
    });
  });

  // ──────────────────────────────────────────────────────────
  // Camino adicional: Las relaciones se cargan correctamente
  // ──────────────────────────────────────────────────────────
  describe('Camino adicional – Carga de relaciones', () => {
    it('debe solicitar relaciones user, comments, comments.user', async () => {
      // Arrange
      recipeRepo.find.mockResolvedValue([]);

      // Act
      await service.findTopLiked();

      // Assert
      expect(recipeRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['user', 'comments', 'comments.user'],
        }),
      );
    });
  });
});
