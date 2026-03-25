/**
 * Explore – Pruebas del servicio findAll()
 *
 * Tipo de mocks usados en este archivo:
 *   - Mock   : recipeRepo.find con mockResolvedValue + assertion explícita de llamada
 *   - Stub   : recipeRepo.find retornando [] sin verificar la llamada
 */
import { RecipesService } from '../recipes/recipes.service';

describe('RecipesService – Explore (findAll)', () => {
  let service: RecipesService;
  let recipeRepo: any;
  let commentRepo: any;

  beforeEach(() => {
    // Arrange global: repositorios mockeados
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
  // EX-01: findAll retorna todas las recetas ordenadas por fecha
  // ──────────────────────────────────────────────────────────
  describe('EX-01 – findAll retorna recetas con orden descendente por fecha', () => {
    it('debe retornar lista de recetas e invocar find con orden correcto', async () => {
      // Arrange – Mock: preparamos retorno y verificaremos la llamada
      const mockRecipes = [
        {
          id: 'r1',
          name: 'Tacos',
          likes: 5,
          tags: ['mexicana'],
          createdAt: new Date('2025-03-01'),
          user: { id: 'u1', username: 'chef1' },
          comments: [],
        },
        {
          id: 'r2',
          name: 'Pizza',
          likes: 3,
          tags: ['italiana'],
          createdAt: new Date('2025-02-01'),
          user: { id: 'u2', username: 'chef2' },
          comments: [],
        },
      ];
      recipeRepo.find.mockResolvedValue(mockRecipes); // Mock

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toHaveLength(2);
      expect(recipeRepo.find).toHaveBeenCalledTimes(1);
      expect(recipeRepo.find).toHaveBeenCalledWith({
        relations: ['user', 'comments', 'comments.user'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  // ──────────────────────────────────────────────────────────
  // EX-02: No hay recetas → lista vacía
  // ──────────────────────────────────────────────────────────
  describe('EX-02 – No existen recetas', () => {
    it('debe retornar array vacío cuando no hay recetas registradas', async () => {
      // Arrange – Stub: retorno fijo, no verificamos la llamada
      recipeRepo.find.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────────────────
  // EX-03: findAll carga relaciones correctas
  // ──────────────────────────────────────────────────────────
  describe('EX-03 – Carga de relaciones en findAll', () => {
    it('debe incluir las relaciones user, comments y comments.user', async () => {
      // Arrange – Stub
      recipeRepo.find.mockResolvedValue([]);

      // Act
      await service.findAll();

      // Assert
      expect(recipeRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['user', 'comments', 'comments.user'],
        }),
      );
    });
  });

  // ──────────────────────────────────────────────────────────
  // EX-04: findAll retorna la estructura de datos correcta
  // ──────────────────────────────────────────────────────────
  describe('EX-04 – Estructura de datos devuelta por findAll', () => {
    it('cada receta debe contener los campos esperados', async () => {
      // Arrange – Mock
      const mockRecipe = {
        id: 'r3',
        name: 'Sushi',
        descripcion: 'Sushi roll japonés',
        ingredients: ['arroz', 'nori'],
        steps: ['lavar arroz', 'enrollar'],
        images: [],
        likes: 0,
        likedBy: [],
        tags: ['japonesa', 'saludable'],
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 'u3', username: 'sushiChef' },
        comments: [],
      };
      recipeRepo.find.mockResolvedValue([mockRecipe]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toHaveLength(1);
      const recipe = result[0];
      expect(recipe).toHaveProperty('id');
      expect(recipe).toHaveProperty('name');
      expect(recipe).toHaveProperty('descripcion');
      expect(recipe).toHaveProperty('ingredients');
      expect(recipe).toHaveProperty('steps');
      expect(recipe).toHaveProperty('user');
      expect(recipe).toHaveProperty('comments');
      expect(recipe).toHaveProperty('tags');
    });
  });

  // ──────────────────────────────────────────────────────────
  // EX-05: findAll solo llama al repositorio una vez
  // ──────────────────────────────────────────────────────────
  describe('EX-05 – findAll no realiza llamadas redundantes al repositorio', () => {
    it('debe llamar a recipeRepo.find exactamente una vez', async () => {
      // Arrange – Stub
      recipeRepo.find.mockResolvedValue([]);

      // Act
      await service.findAll();

      // Assert
      expect(recipeRepo.find).toHaveBeenCalledTimes(1);
    });
  });
});
