import { NotFoundException } from '@nestjs/common';
import { RecipesService } from '../recipes/recipes.service';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  VER COMENTARIOS BACK – Pruebas por camino (assertion, sin mocks)
//  3 caminos + 2 pruebas de fallo
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

  // ──────────────────────────────────────────────────────────
  //  C1: 1→2→3→4→5→7→8→10→FIN
  //  Receta existe, tiene comentarios → retorna comentarios
  // ──────────────────────────────────────────────────────────
  describe('C1: Receta con comentarios (200 OK)', () => {

    it('C1-T1: retorna un array de comentarios', async () => {
      const recipeRepo = { findOne: async () => ({ ...RECIPE }) };
      const commentRepo = { find: async () => [...COMMENTS] };
      const service = new RecipesService(recipeRepo as any, commentRepo as any);

      const result = await service.findCommentsByRecipe('r1');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('C1-T2: cada comentario tiene user y message', async () => {
      const recipeRepo = { findOne: async () => ({ ...RECIPE }) };
      const commentRepo = { find: async () => [...COMMENTS] };
      const service = new RecipesService(recipeRepo as any, commentRepo as any);

      const result = await service.findCommentsByRecipe('r1');

      expect(result[0].message).toBe('Buenísima');
      expect(result[0].user.username).toBe('fan');
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C2: 1→2→3→4→5→6→FIN
  //  Receta no existe → 404 Not Found
  // ──────────────────────────────────────────────────────────
  describe('C2: Receta no existe (404)', () => {

    it('C2-T1: lanza NotFoundException si la receta no existe', async () => {
      const recipeRepo = { findOne: async () => null };
      const commentRepo = { find: async () => [] };
      const service = new RecipesService(recipeRepo as any, commentRepo as any);

      await expect(service.findCommentsByRecipe('no-existo')).rejects.toThrow(NotFoundException);
    });

    it('C2-T2: el mensaje del error contiene el id buscado', async () => {
      const recipeRepo = { findOne: async () => null };
      const commentRepo = { find: async () => [] };
      const service = new RecipesService(recipeRepo as any, commentRepo as any);

      try {
        await service.findCommentsByRecipe('xyz');
        fail('Debería haber lanzado NotFoundException');
      } catch (e: any) {
        expect(e.message).toContain('xyz');
      }
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C3: 1→2→3→4→5→7→8→9→FIN
  //  Receta existe, sin comentarios → array vacío
  // ──────────────────────────────────────────────────────────
  describe('C3: Receta sin comentarios (200 OK, array vacío)', () => {

    it('C3-T1: retorna array vacío', async () => {
      const recipeRepo = { findOne: async () => ({ ...RECIPE, comments: [] }) };
      const commentRepo = { find: async () => [] };
      const service = new RecipesService(recipeRepo as any, commentRepo as any);

      const result = await service.findCommentsByRecipe('r1');

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
      // Simulamos que la receta tiene 1 comentario pero el commentRepo tiene 2
      const recipeRepo = {
        findOne: async () => ({
          ...RECIPE,
          comments: [COMMENTS[0]], // Solo 1
        }),
      };
      const commentRepo = {
        find: async () => [...COMMENTS], // 2 comentarios
      };
      const service = new RecipesService(recipeRepo as any, commentRepo as any);
      const result = await service.findCommentsByRecipe('r1');

      // FALLA: retorna 2 (del commentRepo.find) en vez de 1 (del recipeRepo.findOne)
      // Esto prueba la inconsistencia entre las 2 queries
      expect(result.length).toBe(1);
    });

    // BUG: Si la BD lanza error en commentRepository.find,
    // el servicio no lo captura — sube como 500 genérico.
    it('⛔ F2: error en commentRepo debería ser HttpException manejada', async () => {
      const recipeRepo = { findOne: async () => ({ ...RECIPE }) };
      const commentRepo = {
        find: async () => { throw new Error('Connection lost'); },
      };
      const service = new RecipesService(recipeRepo as any, commentRepo as any);

      let thrownError: any;
      try {
        await service.findCommentsByRecipe('r1');
      } catch (e) {
        thrownError = e;
      }

      // FALLA: es Error genérico, no HttpException
      expect(thrownError).toBeDefined();
      expect(typeof thrownError.getStatus).toBe('function');
    });
  });
});
