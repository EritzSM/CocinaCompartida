import { RecipesService } from '../recipes/recipes.service';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RECETAS POPULARES BACK – Pruebas por camino (AAA + jest.fn mocks)
//  2 caminos + 2 pruebas de fallo
//
//  Servicio:   RecipesService.findTopLiked(limit)
//  Endpoint:   GET /recipes/top-liked (sin AuthGuard, público)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const RECIPES = [
  { id: 'r1', name: 'Pizza', likes: 50, likedBy: [], user: { id: 'u1' }, comments: [] },
  { id: 'r2', name: 'Tacos', likes: 25, likedBy: [], user: { id: 'u2' }, comments: [] },
  { id: 'r3', name: 'Sushi', likes: 5, likedBy: [], user: { id: 'u3' }, comments: [] },
];

describe('Recetas Populares Back – Pruebas por camino', () => {

  let service: RecipesService;
  let mockRecipeRepo: { find: jest.Mock; findOne: jest.Mock };
  let mockCommentRepo: { find: jest.Mock; findOne: jest.Mock };

  beforeEach(() => {
    mockRecipeRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    mockCommentRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    service = new RecipesService(mockRecipeRepo as any, mockCommentRepo as any);
  });

  // ──────────────────────────────────────────────────────────
  //  C1: 1→2→3→FIN
  //  Hay recetas → retorna top N ordenadas por likes DESC
  // ──────────────────────────────────────────────────────────
  describe('C1: Hay recetas (200 OK)', () => {

    it('C1-T1: retorna un array de recetas', async () => {
      // Arrange
      mockRecipeRepo.find.mockResolvedValue([...RECIPES]);

      // Act
      const result = await service.findTopLiked();

      // Assert
      expect(Array.isArray(result)).toBe(true);
    });

    it('C1-T2: retorna máximo 3 recetas por defecto', async () => {
      // Arrange
      mockRecipeRepo.find.mockResolvedValue([...RECIPES]);

      // Act
      const result = await service.findTopLiked();

      // Assert
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('C1-T3: la primera receta es la que tiene más likes', async () => {
      // Arrange
      const sorted = [...RECIPES].sort((a, b) => b.likes - a.likes);
      mockRecipeRepo.find.mockResolvedValue(sorted);

      // Act
      const result = await service.findTopLiked();

      // Assert
      expect(result[0].likes).toBe(50);
    });

    it('C1-T4: respeta un limit personalizado', async () => {
      // Arrange
      const top2 = [...RECIPES].sort((a, b) => b.likes - a.likes).slice(0, 2);
      mockRecipeRepo.find.mockResolvedValue(top2);

      // Act
      const result = await service.findTopLiked(2);

      // Assert
      expect(result.length).toBe(2);
    });

    it('C1-T5: llama a recipeRepository.find con las opciones correctas', async () => {
      // Arrange
      mockRecipeRepo.find.mockResolvedValue([...RECIPES]);

      // Act
      await service.findTopLiked(5);

      // Assert
      expect(mockRecipeRepo.find).toHaveBeenCalledWith({
        relations: ['user', 'comments', 'comments.user'],
        order: { likes: 'DESC', createdAt: 'DESC' },
        take: 5,
      });
    });

    it('C1-T6: usa limit por defecto = 3 cuando no se pasa argumento', async () => {
      // Arrange
      mockRecipeRepo.find.mockResolvedValue([...RECIPES]);

      // Act
      await service.findTopLiked();

      // Assert
      expect(mockRecipeRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 3 }),
      );
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C2: 1→2→4→FIN
  //  No hay recetas → retorna array vacío
  // ──────────────────────────────────────────────────────────
  describe('C2: No hay recetas (200 OK, array vacío)', () => {

    it('C2-T1: retorna array vacío', async () => {
      // Arrange
      mockRecipeRepo.find.mockResolvedValue([]);

      // Act
      const result = await service.findTopLiked();

      // Assert
      expect(result.length).toBe(0);
    });

    it('C2-T2: el resultado es un array (no null ni undefined)', async () => {
      // Arrange
      mockRecipeRepo.find.mockResolvedValue([]);

      // Act
      const result = await service.findTopLiked();

      // Assert
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ⛔ PRUEBAS QUE HACEN FALLAR EL CÓDIGO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('⛔ Fallos esperados (bugs)', () => {

    // BUG: findTopLiked no valida el parámetro limit.
    // Si se pasa limit = -1 o limit = 0, no lanza error,
    // simplemente retorna un resultado inesperado.
    it('⛔ F1: limit = 0 debería lanzar error pero retorna array vacío', async () => {
      // Arrange
      mockRecipeRepo.find.mockResolvedValue([]);

      // Act
      let threw = false;
      try {
        await service.findTopLiked(0);
      } catch {
        threw = true;
      }

      // Assert — FALLA: no lanza error cuando limit es 0
      expect(threw).toBe(true);
    });

    // BUG: Si recipeRepository.find() lanza un error de BD,
    // findTopLiked NO lo captura — se propaga como 500 genérico.
    // Debería devolver un HttpException controlada.
    it('⛔ F2: error de BD devuelve 500 genérico en vez de HttpException controlada', async () => {
      // Arrange
      mockRecipeRepo.find.mockRejectedValue(new Error('Connection refused'));

      // Act
      let thrownError: any;
      try {
        await service.findTopLiked();
      } catch (e: any) {
        thrownError = e;
      }

      // Assert — FALLA: es un Error genérico, no tiene getStatus()
      expect(thrownError).toBeDefined();
      expect(typeof thrownError.getStatus).toBe('function');
    });
  });
});
