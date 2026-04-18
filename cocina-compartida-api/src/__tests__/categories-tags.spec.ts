/**
 * Categories / Tags – Pruebas de filtrado por tag
 *
 * La funcionalidad de tags consiste en:
 *   - Campo `tags: string[]` en la entidad Recipe
 *   - Método `findByTag(tag)` en RecipesService
 *   - Endpoint GET /recipes/by-tag/:tag en RecipesController
 *
 * Tipo de mocks usados en este archivo:
 *   - Stub  : recipeRepo.find retorna lista predefinida para probar el filtrado
 *   - Fake  : implementación fake de find que simula comportamiento real de DB
 */
import { RecipesService } from '../recipes/recipes.service';

describe('RecipesService – Categories/Tags (findByTag)', () => {
  let service: RecipesService;
  let recipeRepo: any;
  let commentRepo: any;

  const buildMockRecipes = () => [
    {
      id: 'r1',
      name: 'Tacos al Pastor',
      tags: ['mexicana', 'carne'],
      user: { id: 'u1' },
      comments: [],
    },
    {
      id: 'r2',
      name: 'Pizza Margarita',
      tags: ['italiana', 'vegetariana'],
      user: { id: 'u2' },
      comments: [],
    },
    {
      id: 'r3',
      name: 'Guacamole',
      tags: ['mexicana', 'vegetariana'],
      user: { id: 'u3' },
      comments: [],
    },
    {
      id: 'r4',
      name: 'Sushi Roll',
      tags: null, // sin tags — borde negativo
      user: { id: 'u4' },
      comments: [],
    },
    {
      id: 'r5',
      name: 'Ensalada César',
      tags: [],
      user: { id: 'u5' },
      comments: [],
    },
  ];

  beforeEach(() => {
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
  // CT-01: findByTag filtra correctamente por tag exacto
  // ──────────────────────────────────────────────────────────
  describe('CT-01 – findByTag retorna solo recetas con el tag indicado', () => {
    it('debe retornar únicamente las recetas que contienen el tag "mexicana"', async () => {
      // Test Double: Stub – mockResolvedValue retorna lista fija sin verificar args
      // Arrange – Stub: retorna lista fija
      recipeRepo.find.mockResolvedValue(buildMockRecipes());

      // Act
      const result = await service.findByTag('mexicana');

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id)).toEqual(expect.arrayContaining(['r1', 'r3']));
      result.forEach((r) => expect(r.tags).toContain('mexicana'));
    });
  });

  // ──────────────────────────────────────────────────────────
  // CT-02: findByTag retorna lista vacía cuando ninguna receta tiene el tag
  // ──────────────────────────────────────────────────────────
  describe('CT-02 – findByTag retorna lista vacía cuando no hay coincidencias', () => {
    it('debe retornar [] cuando el tag no existe en ninguna receta', async () => {
      // Test Double: Stub – mockResolvedValue retorna lista fija sin verificar args
      // Arrange – Stub
      recipeRepo.find.mockResolvedValue(buildMockRecipes());

      // Act
      const result = await service.findByTag('coreana');

      // Assert
      expect(result).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────────────────
  // CT-03: findByTag ignora recetas con tags null o vacío
  // ──────────────────────────────────────────────────────────
  describe('CT-03 – findByTag no falla con recetas sin tags', () => {
    it('debe omitir recetas cuyo campo tags sea null o array vacío', async () => {
      // Test Double: Stub – mockResolvedValue retorna lista fija sin verificar args
      // Arrange – Stub
      recipeRepo.find.mockResolvedValue(buildMockRecipes());

      // Act
      const result = await service.findByTag('vegetariana');

      // Assert – r4 (tags: null) y r5 (tags: []) no deben aparecer
      const ids = result.map((r) => r.id);
      expect(ids).not.toContain('r4');
      expect(ids).not.toContain('r5'); 
      expect(result).toHaveLength(2); // r2 y r3
    });
  });

  // ──────────────────────────────────────────────────────────
  // CT-04: findByTag invoca a find() con relaciones correctas
  // ──────────────────────────────────────────────────────────
  describe('CT-04 – findByTag carga las relaciones correctas', () => {
    it('debe invocar recipeRepo.find con todas las relaciones necesarias', async () => {
      // Test Double: Mock – toHaveBeenCalledWith verifica relaciones en la llamada a find
      // Arrange – Stub
      recipeRepo.find.mockResolvedValue([]);

      // Act
      await service.findByTag('italiana');

      // Assert
      expect(recipeRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['user', 'comments', 'comments.user'],
        }),
      );
    });
  });

  // ──────────────────────────────────────────────────────────
  // CT-05: findByTag con Fake – simula comportamiento real de filtrado
  // ──────────────────────────────────────────────────────────
  describe('CT-05 – findByTag filtra de forma consistente con múltiples tags por receta', () => {
    it('debe retornar la receta si posee el tag, independientemente de otros tags', async () => {
      // Test Double: Fake – mockImplementation con implementación realista de acceso a datos
      // Arrange – Fake: implementación que simula acceso a datos realista
      const fakeData = [
        { id: 'rx1', name: 'Burrito', tags: ['mexicana', 'carne', 'picante'], user: {}, comments: [] },
        { id: 'rx2', name: 'Torta', tags: ['mexicana', 'rápida'], user: {}, comments: [] },
        { id: 'rx3', name: 'Ramen', tags: ['japonesa', 'caldo'], user: {}, comments: [] },
      ];
      recipeRepo.find.mockImplementation(async () => fakeData); // Fake implementation

      // Act
      const result = await service.findByTag('picante');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('rx1');
    });
  });

  // ──────────────────────────────────────────────────────────
  // CT-06: Entidad Recipe tiene campo tags disponible
  // ──────────────────────────────────────────────────────────
  describe('CT-06 – La entidad Recipe expone el campo tags', () => {
    it('debe tener el campo tags definido y accesible', async () => {
      // Test Double: Stub – mockResolvedValue retorna receta con tags sin verificar args
      // Arrange – Stub con receta que tiene tags
      const recipeWithTags = {
        id: 'r-tags',
        name: 'Test con tags',
        tags: ['tag1', 'tag2'],
        user: { id: 'u1' },
        comments: [],
      };
      recipeRepo.find.mockResolvedValue([recipeWithTags]);

      // Act
      const result = await service.findByTag('tag1');

      // Assert
      expect(result[0]).toHaveProperty('tags');
      expect(Array.isArray(result[0].tags)).toBe(true);
    });
  });
});
