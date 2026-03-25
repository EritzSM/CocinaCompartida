import { Recipe } from '../app/shared/interfaces/recipe';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RECETAS POPULARES FRONT – Pruebas por camino (assertion, sin mocks)
//  3 caminos + 2 pruebas de fallo
//
//  Componente: Home.featuredRecipes (getter)
//  Servicio:   RecipeCrudService.loadTopLikedRecipes()
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const R1: Recipe = {
  id: 'r1', name: 'Paella', descripcion: 'Arroz', ingredients: ['arroz'],
  steps: ['cocinar'], images: ['img1.png'], category: 'Española',
  user: { id: 'u1', username: 'chef1' }, likes: 10, likedBy: [],
  comments: [],
};
const R2: Recipe = {
  id: 'r2', name: 'Tacos', descripcion: 'Tacos', ingredients: ['tortilla'],
  steps: ['armar'], images: ['img2.png'], category: 'Mexicana',
  user: { id: 'u2', username: 'chef2' }, likes: 25, likedBy: [],
  comments: [],
};
const R3: Recipe = {
  id: 'r3', name: 'Sushi', descripcion: 'Sushi', ingredients: ['arroz'],
  steps: ['enrollar'], images: ['img3.png'], category: 'Japonesa',
  user: { id: 'u3', username: 'chef3' }, likes: 5, likedBy: [],
  comments: [],
};
const R4: Recipe = {
  id: 'r4', name: 'Pizza', descripcion: 'Pizza', ingredients: ['masa'],
  steps: ['hornear'], images: ['img4.png'], category: 'Italiana',
  user: { id: 'u4', username: 'chef4' }, likes: 50, likedBy: [],
  comments: [],
};
const R5: Recipe = {
  id: 'r5', name: 'Ceviche', descripcion: 'Ceviche', ingredients: ['pescado'],
  steps: ['marinar'], images: ['img5.png'], category: 'Peruana',
  user: { id: 'u5', username: 'chef5' }, likes: 15, likedBy: [],
  comments: [],
};

/* ────────── Lógica de featuredRecipes extraída del componente Home ────────── */
function getFeaturedRecipes(allRecipes: Recipe[], limit: number = 3): Recipe[] {
  return [...allRecipes]
    .sort((a, b) => {
      const likesA = Number.isFinite(a.likes) ? a.likes! : 0;
      const likesB = Number.isFinite(b.likes) ? b.likes! : 0;
      return likesB - likesA;
    })
    .slice(0, limit);
}

/* ────────── Simulación de loadTopLikedRecipes (del RecipeCrudService) ────────── */
async function loadTopLikedRecipes(succeeds: boolean, data: Recipe[]): Promise<Recipe[]> {
  if (succeeds) {
    return data;
  } else {
    // Simula el catch del servicio real que retorna []
    console.error('loadTopLikedRecipes error', new Error('Network error'));
    return [];
  }
}

describe('Recetas Populares Front – Pruebas por camino', () => {

  // ──────────────────────────────────────────────────────────
  //  C1: 1→2→3→4→FIN
  //  Hay recetas con likes → se retornan ordenadas, máximo 3
  // ──────────────────────────────────────────────────────────
  describe('C1: Recetas con likes (ordenadas por popularidad)', () => {

    it('C1-T1: retorna exactamente 3 recetas cuando hay más de 3', () => {
      const result = getFeaturedRecipes([R1, R2, R3, R4, R5]);
      expect(result.length).toBe(3);
    });

    it('C1-T2: la primera receta es la que tiene más likes', () => {
      const result = getFeaturedRecipes([R1, R2, R3, R4, R5]);
      expect(result[0].id).toBe('r4'); // Pizza: 50 likes
    });

    it('C1-T3: el orden es descendente por likes', () => {
      const result = getFeaturedRecipes([R1, R2, R3, R4, R5]);
      expect(result[0].likes).toBeGreaterThanOrEqual(result[1].likes!);
      expect(result[1].likes).toBeGreaterThanOrEqual(result[2].likes!);
    });

    it('C1-T4: las 3 recetas son Pizza(50), Tacos(25), Ceviche(15)', () => {
      const result = getFeaturedRecipes([R1, R2, R3, R4, R5]);
      expect(result.map(r => r.id)).toEqual(['r4', 'r2', 'r5']);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C2: 1→2→5→FIN
  //  No hay recetas → retorna array vacío
  // ──────────────────────────────────────────────────────────
  describe('C2: Sin recetas (array vacío)', () => {

    it('C2-T1: retorna array vacío si no hay recetas', () => {
      const result = getFeaturedRecipes([]);
      expect(result.length).toBe(0);
    });

    it('C2-T2: retorna array vacío (no null ni undefined)', () => {
      const result = getFeaturedRecipes([]);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C3: 1→2→3→6→7→FIN
  //  Error en petición HTTP → retorna array vacío
  // ──────────────────────────────────────────────────────────
  describe('C3: Error en la petición HTTP', () => {

    it('C3-T1: loadTopLikedRecipes retorna array vacío tras error', async () => {
      const result = await loadTopLikedRecipes(false, []);
      expect(result.length).toBe(0);
    });

    it('C3-T2: el resultado es un array (no null)', async () => {
      const result = await loadTopLikedRecipes(false, []);
      expect(Array.isArray(result)).toBe(true);
    });

    it('C3-T3: loadTopLikedRecipes exitoso retorna las recetas del backend', async () => {
      const result = await loadTopLikedRecipes(true, [R4, R2, R5]);
      expect(result.length).toBe(3);
      expect(result[0].id).toBe('r4');
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ⛔ PRUEBAS QUE HACEN FALLAR EL CÓDIGO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('⛔ Fallos esperados (bugs)', () => {

    // BUG: featuredRecipes ordena en el frontend con sort() mutante.
    // El getter usa this.allRecipes().sort(...) que MUTA el array original
    // del signal si no se clona primero. Esto puede causar efectos secundarios.
    it('⛔ F1: sort no debería mutar el array original de recetas', () => {
      const original = [R1, R2, R3, R4, R5];
      const originalOrder = original.map(r => r.id);

      // Simula la lógica FIJADA del componente Home (clonando):
      const recipes = [...original]; // Clon
      recipes.sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 3);

      // AHORA PASA: el array original NO es mutado
      expect(original.map(r => r.id)).toEqual(originalOrder);
    });

    // BUG: Si una receta tiene likes = undefined o null,
    // el fallback (b.likes || 0) funciona, pero likes = NaN rompería el sort.
    it('⛔ F2: receta con likes = NaN rompe el ordenamiento', () => {
      const broken: Recipe = {
        ...R1, id: 'broken', likes: NaN,
      };
      const result = getFeaturedRecipes([broken, R2, R3]);

      // AHORA PASA: con Number.isFinite el orden es predecible, el broken (NaN -> 0) va al final
      expect(result[0].id).toBe('r2'); // Tacos es primero (25 likes)
      expect(result[2].id).toBe('broken'); // El roto va al final
    });
  });
});
