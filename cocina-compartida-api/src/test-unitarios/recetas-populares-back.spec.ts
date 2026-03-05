import { RecipesService } from '../recipes/recipes.service';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RECETAS POPULARES BACK – Pruebas por camino (assertion, sin mocks)
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

function makeService(recipes: any[], shouldThrow = false) {
  const recipeRepo = {
    find: async (opts: any) => {
      if (shouldThrow) throw new Error('Connection refused');
      // Simula el comportamiento real: order by likes DESC, take: limit
      const sorted = [...recipes].sort((a, b) => (b.likes || 0) - (a.likes || 0));
      return sorted.slice(0, opts?.take ?? recipes.length);
    },
    findOne: async () => null,
  };
  const commentRepo = { find: async () => [], findOne: async () => null };
  return new RecipesService(recipeRepo as any, commentRepo as any);
}

describe('Recetas Populares Back – Pruebas por camino', () => {

  // ──────────────────────────────────────────────────────────
  //  C1: 1→2→3→FIN
  //  Hay recetas → retorna top N ordenadas por likes DESC
  // ──────────────────────────────────────────────────────────
  describe('C1: Hay recetas (200 OK)', () => {

    it('C1-T1: retorna un array de recetas', async () => {
      const svc = makeService(RECIPES);
      const result = await svc.findTopLiked();
      expect(Array.isArray(result)).toBe(true);
    });

    it('C1-T2: retorna máximo 3 recetas por defecto', async () => {
      const svc = makeService(RECIPES);
      const result = await svc.findTopLiked();
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('C1-T3: la primera receta es la que tiene más likes', async () => {
      const svc = makeService(RECIPES);
      const result = await svc.findTopLiked();
      expect(result[0].likes).toBe(50);
    });

    it('C1-T4: respeta un limit personalizado', async () => {
      const svc = makeService(RECIPES);
      const result = await svc.findTopLiked(2);
      expect(result.length).toBe(2);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C2: 1→2→4→FIN
  //  No hay recetas → retorna array vacío
  // ──────────────────────────────────────────────────────────
  describe('C2: No hay recetas (200 OK, array vacío)', () => {

    it('C2-T1: retorna array vacío', async () => {
      const svc = makeService([]);
      const result = await svc.findTopLiked();
      expect(result.length).toBe(0);
    });

    it('C2-T2: el resultado es un array (no null ni undefined)', async () => {
      const svc = makeService([]);
      const result = await svc.findTopLiked();
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
      const svc = makeService(RECIPES);
      let threw = false;
      try {
        const result = await svc.findTopLiked(0);
        // No lanzó error — debería haberlo hecho
      } catch {
        threw = true;
      }
      // FALLA: no lanza error cuando limit es 0
      expect(threw).toBe(true);
    });

    // BUG: Si recipeRepository.find() lanza un error de BD,
    // findTopLiked NO lo captura — se propaga como 500 genérico.
    // Debería devolver un HttpException controlada.
    it('⛔ F2: error de BD devuelve 500 genérico en vez de HttpException controlada', async () => {
      const svc = makeService([], true);
      let thrownError: any;
      try {
        await svc.findTopLiked();
      } catch (e: any) {
        thrownError = e;
      }
      // FALLA: es un Error genérico, no tiene getStatus()
      expect(thrownError).toBeDefined();
      expect(typeof thrownError.getStatus).toBe('function');
    });
  });
});
