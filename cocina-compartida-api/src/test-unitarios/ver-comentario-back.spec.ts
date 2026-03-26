import { NotFoundException } from '@nestjs/common';
import { RecipesService } from '../recipes/recipes.service';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  VER COMENTARIOS BACK – Pruebas por camino (AAA + jest.fn mocks)
//  3 caminos + 2 pruebas de fallo
//
//  Servicio:   RecipesService.findCommentsByRecipe(recipeId)
//  Endpoint:   GET /recipes/:id/comments
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const RECIPE = {
  id: 'r1', name: 'Pasta', descripcion: 'desc',
  ingredients: ['pasta'], steps: ['cocinar'], images: [],
  category: 'Italiana', likes: 0, likedBy: [],
  user: { id: 'u1', username: 'chef' },
  comments: [
    { id: 'c1', message: 'Buenísima', user: { id: 'u2', username: 'fan' }, createdAt: new Date() },
  ],
};

const COMMENTS = [
  { id: 'c1', message: 'Buenísima', user: { id: 'u2', username: 'fan' }, createdAt: new Date() },
  { id: 'c2', message: 'Excelente', user: { id: 'u3', username: 'fan2' }, createdAt: new Date() },
];

describe('Ver Comentarios Back – Pruebas por camino', () => {

  let service: RecipesService;
  let mockRecipeRepo: { findOne: jest.Mock; find: jest.Mock };
  let mockCommentRepo: { find: jest.Mock; findOne: jest.Mock };

  beforeEach(() => {
    mockRecipeRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };
    mockCommentRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    service = new RecipesService(mockRecipeRepo as any, mockCommentRepo as any);
  });

  // ──────────────────────────────────────────────────────────
  //  C1: 1→2→3→4→5→7→8→10→FIN
  //  Receta existe, tiene comentarios → retorna comentarios
  // ──────────────────────────────────────────────────────────
  describe('C1: Receta con comentarios (200 OK)', () => {

    it('C1-T1: retorna un array de comentarios', async () => {
      // Arrange
      mockRecipeRepo.findOne.mockResolvedValue({ ...RECIPE });
      mockCommentRepo.find.mockResolvedValue([...COMMENTS]);

      // Act
      const result = await service.findCommentsByRecipe('r1');

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('C1-T2: cada comentario tiene user y message', async () => {
      // Arrange
      mockRecipeRepo.findOne.mockResolvedValue({ ...RECIPE });
      mockCommentRepo.find.mockResolvedValue([...COMMENTS]);

      // Act
      const result = await service.findCommentsByRecipe('r1');

      // Assert
      expect(result[0].message).toBe('Buenísima');
      expect(result[0].user.username).toBe('fan');
    });

    it('C1-T3: llama a commentRepository.find con las opciones correctas', async () => {
      // Arrange
      mockRecipeRepo.findOne.mockResolvedValue({ ...RECIPE });
      mockCommentRepo.find.mockResolvedValue([...COMMENTS]);

      // Act
      await service.findCommentsByRecipe('r1');

      // Assert
      expect(mockCommentRepo.find).toHaveBeenCalledWith({
        where: { recipe: { id: 'r1' } },
        relations: ['user'],
        order: { createdAt: 'ASC' },
      });
    });

    it('C1-T4: verifica que findOne se llama primero para validar la receta', async () => {
      // Arrange
      mockRecipeRepo.findOne.mockResolvedValue({ ...RECIPE });
      mockCommentRepo.find.mockResolvedValue([...COMMENTS]);

      // Act
      await service.findCommentsByRecipe('r1');

      // Assert
      expect(mockRecipeRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'r1' },
        relations: ['user', 'comments', 'comments.user'],
      });
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C2: 1→2→3→4→5→6→FIN
  //  Receta no existe → 404 Not Found
  // ──────────────────────────────────────────────────────────
  describe('C2: Receta no existe (404)', () => {

    it('C2-T1: lanza NotFoundException si la receta no existe', async () => {
      // Arrange
      mockRecipeRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findCommentsByRecipe('no-existo')).rejects.toThrow(NotFoundException);
    });

    it('C2-T2: el mensaje del error contiene el id buscado', async () => {
      // Arrange
      mockRecipeRepo.findOne.mockResolvedValue(null);

      // Act
      let thrownError: any;
      try {
        await service.findCommentsByRecipe('xyz');
      } catch (e: any) {
        thrownError = e;
      }

      // Assert
      expect(thrownError).toBeInstanceOf(NotFoundException);
      expect(thrownError.message).toContain('xyz');
    });

    it('C2-T3: no llama a commentRepository.find si la receta no existe', async () => {
      // Arrange
      mockRecipeRepo.findOne.mockResolvedValue(null);

      // Act
      try { await service.findCommentsByRecipe('no-existo'); } catch {}

      // Assert
      expect(mockCommentRepo.find).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C3: 1→2→3→4→5→7→8→9→FIN
  //  Receta existe, sin comentarios → array vacío
  // ──────────────────────────────────────────────────────────
  describe('C3: Receta sin comentarios (200 OK, array vacío)', () => {

    it('C3-T1: retorna array vacío', async () => {
      // Arrange
      mockRecipeRepo.findOne.mockResolvedValue({ ...RECIPE, comments: [] });
      mockCommentRepo.find.mockResolvedValue([]);

      // Act
      const result = await service.findCommentsByRecipe('r1');

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ⛔ PRUEBAS QUE HACEN FALLAR EL CÓDIGO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('⛔ Fallos esperados (bugs)', () => {

    // BUG: findCommentsByRecipe llama a findOne internamente
    // (que ya hace un query con relations). Luego hace OTRO query
    // con commentRepository.find. Son 2 queries cuando 1 bastaría.
    // El segundo query podría ser inconsistente si se eliminó un
    // comentario entre ambas queries.
    it('⛔ F1: debería retornar los comentarios del findOne, no hacer 2 queries', async () => {
      // Arrange — receta tiene 1 comentario pero commentRepo retorna 2
      mockRecipeRepo.findOne.mockResolvedValue({
        ...RECIPE,
        comments: [COMMENTS[0]], // Solo 1
      });
      mockCommentRepo.find.mockResolvedValue([...COMMENTS]); // 2 comentarios

      // Act
      const result = await service.findCommentsByRecipe('r1');

      // Assert — BUG documentado: retorna 2 (del commentRepo.find) en vez de 1
      expect(result.length).toBe(2);
    });

    // BUG: Si la BD lanza error en commentRepository.find,
    // el servicio no lo captura — sube como 500 genérico.
    it('⛔ F2: error en commentRepo debería ser HttpException manejada', async () => {
      // Arrange
      mockRecipeRepo.findOne.mockResolvedValue({ ...RECIPE });
      mockCommentRepo.find.mockRejectedValue(new Error('Connection lost'));

      // Act
      let thrownError: any;
      try {
        await service.findCommentsByRecipe('r1');
      } catch (e) {
        thrownError = e;
      }

      // Assert — FALLA: es Error genérico, no HttpException
      expect(thrownError).toBeDefined();
      expect(typeof thrownError.getStatus).toBe('function');
    });
  });
});
