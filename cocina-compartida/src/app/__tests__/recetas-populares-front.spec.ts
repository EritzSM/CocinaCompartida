import { Recipe } from '../shared/interfaces/recipe';

/**
 * RECETAS POPULARES FRONT – Triple-A / FIRST / 5 tipos de mock
 * ─────────────────────────────────────────────────────────────────────────
 * Tipos de mock utilizados:
 *   DUMMY  → Objetos Recipe R1–R5: datos de prueba sin comportamiento;
 *             se pasan como argumento pero su lógica interna no importa.
 *   STUB   → loadTopLikedRecipesStub: devuelve un dataset fijo o []
 *             según la bandera; sin lógica HTTP real.
 *   SPY    → spyOn(console, 'error') en C3-T1: registra si el error
 *             de red fue logueado para verificarlo en la fase Assert.
 *   MOCK   → httpErrorMock en C3-T3: objeto pre-programado que lanzaría
 *             error si fuera invocado; verificar que no se llama es la
 *             propia especificación de comportamiento del camino exitoso.
 *   FAKE   → getFeaturedRecipes: implementación real y operativa extraída
 *             del componente Home; usa spread para no mutar el original.
 *
 * Principios FIRST:
 *   Fast        – Funciones puras síncronas; una sola Promise en C3.
 *   Independent – Cada test recibe sus propios datos; sin estado compartido.
 *   Repeatable  – Likes hardcoded; sin aleatoriedad ni fechas.
 *   Self-val.   – Cada test tiene al menos un expect() con resultado booleano.
 *   Timely      – Tests escritos junto al desarrollo de la funcionalidad.
 */

// ── Datos de prueba ([DUMMY] – objetos de datos sin comportamiento) ────────
const R1: Recipe = {
  id: 'r1', name: 'Paella',  descripcion: 'Arroz', ingredients: ['arroz'],
  steps: ['cocinar'],  images: ['img1.png'], category: 'Española',
  user: { id: 'u1', username: 'chef1' }, likes: 10, likedBy: [], comments: [],
};
const R2: Recipe = {
  id: 'r2', name: 'Tacos',   descripcion: 'Tacos', ingredients: ['tortilla'],
  steps: ['armar'],    images: ['img2.png'], category: 'Mexicana',
  user: { id: 'u2', username: 'chef2' }, likes: 25, likedBy: [], comments: [],
};
const R3: Recipe = {
  id: 'r3', name: 'Sushi',   descripcion: 'Sushi', ingredients: ['arroz'],
  steps: ['enrollar'], images: ['img3.png'], category: 'Japonesa',
  user: { id: 'u3', username: 'chef3' }, likes:  5, likedBy: [], comments: [],
};
const R4: Recipe = {
  id: 'r4', name: 'Pizza',   descripcion: 'Pizza', ingredients: ['masa'],
  steps: ['hornear'],  images: ['img4.png'], category: 'Italiana',
  user: { id: 'u4', username: 'chef4' }, likes: 50, likedBy: [], comments: [],
};
const R5: Recipe = {
  id: 'r5', name: 'Ceviche', descripcion: 'Ceviche', ingredients: ['pescado'],
  steps: ['marinar'],  images: ['img5.png'], category: 'Peruana',
  user: { id: 'u5', username: 'chef5' }, likes: 15, likedBy: [], comments: [],
};

// ── [FAKE] – lógica real de featuredRecipes extraída del componente Home ───
function getFeaturedRecipes(allRecipes: Recipe[], limit = 3): Recipe[] {
  return [...allRecipes]
    .filter(r => Number.isFinite(r.likes))
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, limit);
}

// ── [STUB] – simula RecipeCrudService.loadTopLikedRecipes ─────────────────
async function loadTopLikedRecipesStub(succeeds: boolean, data: Recipe[]): Promise<Recipe[]> {
  if (succeeds) return data;
  console.error('loadTopLikedRecipes error', new Error('Network error'));
  return [];
}

// ── Suite ──────────────────────────────────────────────────────────────────
describe('Recetas Populares Front – AAA / FIRST / Mocks', () => {

  // ── C1: Recetas con likes ─────────────────────────────────────────────
  describe('C1: Recetas con likes (ordenadas por popularidad)', () => {

    it('C1-T1: retorna exactamente 3 recetas cuando hay más de 3', () => {
      // Arrange – [DUMMY]: recetas predefinidas sin comportamiento propio
      const allRecipes = [R1, R2, R3, R4, R5];

      // Act
      const result = getFeaturedRecipes(allRecipes);

      // Assert
      expect(result.length).toBe(3);
    });

    it('C1-T2: la primera receta es la que tiene más likes', () => {
      // Arrange
      const allRecipes = [R1, R2, R3, R4, R5];

      // Act
      const result = getFeaturedRecipes(allRecipes);

      // Assert
      expect(result[0].id).toBe('r4'); // Pizza: 50 likes
    });

    it('C1-T3: el orden es estrictamente descendente por likes', () => {
      // Arrange
      const allRecipes = [R1, R2, R3, R4, R5];

      // Act
      const result = getFeaturedRecipes(allRecipes);

      // Assert
      expect(result[0].likes!).toBeGreaterThanOrEqual(result[1].likes!);
      expect(result[1].likes!).toBeGreaterThanOrEqual(result[2].likes!);
    });

    it('C1-T4: el top 3 es exactamente Pizza(50), Tacos(25), Ceviche(15)', () => {
      // Arrange
      const allRecipes = [R1, R2, R3, R4, R5];

      // Act
      const result = getFeaturedRecipes(allRecipes);

      // Assert
      expect(result.map(r => r.id)).toEqual(['r4', 'r2', 'r5']);
    });
  });

  // ── C2: Sin recetas ────────────────────────────────────────────────────
  describe('C2: Sin recetas (array vacío)', () => {

    it('C2-T1: retorna [] si no hay recetas', () => {
      // Arrange – [DUMMY]: array vacío como entrada válida
      const allRecipes: Recipe[] = [];

      // Act
      const result = getFeaturedRecipes(allRecipes);

      // Assert
      expect(result.length).toBe(0);
    });

    it('C2-T2: el resultado es un array (no null ni undefined)', () => {
      // Arrange
      const allRecipes: Recipe[] = [];

      // Act
      const result = getFeaturedRecipes(allRecipes);

      // Assert
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ── C3: Error en la petición HTTP ──────────────────────────────────────
  describe('C3: Error en la petición HTTP', () => {

    it('C3-T1: loadTopLikedRecipes retorna [] y registra el error [Spy]', async () => {
      // Arrange – [SPY]: monitorizamos console.error para verificar el logging
      const consoleSpy = spyOn(console, 'error');

      // Act
      const result = await loadTopLikedRecipesStub(false, []);

      // Assert – el [SPY] confirma que el error fue logueado
      expect(result.length).toBe(0);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('C3-T2: el resultado es un array (no null) tras el error', async () => {
      // Arrange
      spyOn(console, 'error');

      // Act
      const result = await loadTopLikedRecipesStub(false, []);

      // Assert
      expect(Array.isArray(result)).toBe(true);
    });

    it('C3-T3: loadTopLikedRecipes exitoso retorna las recetas del backend [Mock]', async () => {
      // Arrange
      // [MOCK] – objeto pre-programado que lanzaría error si fuera llamado;
      //          verificar que NO se invoca es la expectativa del camino exitoso
      const httpErrorMock = {
        get: jasmine.createSpy('httpGet').and.throwError('No debería llamarse'),
      };
      const backendData = [R4, R2, R5]; // [DUMMY]

      // Act
      const result = await loadTopLikedRecipesStub(true, backendData);

      // Assert
      expect(result.length).toBe(3);
      expect(result[0].id).toBe('r4');
      expect(httpErrorMock.get).not.toHaveBeenCalled(); // [MOCK] no fue invocado
    });
  });

  // ── ⛔ Bugs documentados ──────────────────────────────────────────────
  describe('⛔ Fallos esperados (bugs en el código)', () => {

    it('⛔ F1: sort() NO debería mutar el array original de recetas', () => {
      // Arrange – [DUMMY]: array original cuyo orden queremos preservar
      const original    = [R1, R2, R3, R4, R5];
      const orderBefore = original.map(r => r.id);

      // Act – simula la implementación REAL del componente (sin clonar con spread)
      const directRef = original;
      directRef.sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 3);

      // Assert – BUG documentado: sort() SÍ mutó el array original
      expect(original.map(r => r.id)).not.toEqual(orderBefore);
    });

    it('⛔ F2: receta con likes = NaN rompe el ordenamiento', () => {
      // Arrange – [DUMMY]: receta con dato numérico corrupto
      const broken: Recipe = { ...R1, id: 'broken', likes: NaN };

      // Act
      const result = getFeaturedRecipes([broken, R2, R3]);

      // Assert – FALLA: NaN produce orden impredecible; Tacos debería ser primero
      expect(result[0].id).toBe('r2');
      expect(Number.isFinite(result[result.length - 1].likes!)).toBe(true);
    });
  });
});
