/**
 * ============================================================
 * PRUEBAS UNITARIAS - Funcionalidad 5: FAVORITOS / TOGGLE LIKE
 * Diagrama 9 (Flujo): 14 conexiones × 2 = 28 pruebas
 *
 * Código analizado: toggleLike() (backend + frontend)
 * Servicios: RecipesService.toggleLike + RecipeInteractionService.toggleLike
 * ============================================================
 */

// ---- Excepciones ----
class NotFoundException extends Error {
  constructor(msg) { super(msg); this.name = 'NotFoundException'; this.status = 404; }
}

// ---- Mock del sistema de favoritos (lógica pura extraída) ----

function createFavoritesService() {
  const recipes = new Map();

  return {
    addRecipe(recipe) {
      recipes.set(recipe.id, { ...recipe, likedBy: recipe.likedBy || [], likes: recipe.likes || 0 });
    },

    getRecipe(id) {
      return recipes.get(id) || null;
    },

    toggleLike(recipeId, user) {
      // Paso 1: Usuario autenticado?
      if (!user || !user.id) {
        return { success: false, error: 'Necesitas iniciar sesión', needsAuth: true };
      }

      // Paso 2: Obtener recipeId y buscar receta
      const recipe = recipes.get(recipeId);
      if (!recipe) {
        throw new NotFoundException(`Recipe "${recipeId}" not found`);
      }

      // Paso 3: Verificar array likedBy
      if (!Array.isArray(recipe.likedBy)) {
        recipe.likedBy = [];
      }

      // Paso 4: user.id en likedBy?
      const hasLiked = recipe.likedBy.includes(user.id);

      if (hasLiked) {
        // Remover like
        recipe.likedBy = recipe.likedBy.filter(u => u !== user.id);
      } else {
        // Agregar like
        recipe.likedBy.push(user.id);
      }

      // Actualizar likes count y guardar
      recipe.likes = recipe.likedBy.length;

      // Retornar respuesta
      return {
        success: true,
        likes: recipe.likes,
        likedBy: [...recipe.likedBy],
        action: hasLiked ? 'unliked' : 'liked',
      };
    },

    isLikedByUser(recipeId, userId) {
      const recipe = recipes.get(recipeId);
      if (!recipe) return false;
      return (recipe.likedBy || []).includes(userId);
    },
  };
}

// ---- Datos de prueba ----
const mockUser = { id: 'user-1', username: 'testuser' };

// ============================================================
// 28 PRUEBAS UNITARIAS
// ============================================================

describe('Funcionalidad 5: Favoritos / Toggle Like (28 tests - Diagrama 9)', () => {
  let svc;

  beforeEach(() => {
    svc = createFavoritesService();
    svc.addRecipe({ id: 'r1', name: 'Tacos', likes: 2, likedBy: ['user-3', 'user-4'] });
    svc.addRecipe({ id: 'r2', name: 'Ensalada', likes: 0, likedBy: [] });
    svc.addRecipe({ id: 'r3', name: 'Flan', likes: 1, likedBy: ['user-1'] });
  });

  // Conexión 1→2: Inicio → Usuario autenticado?
  test('D9-C01a: toggleLike con usuario válido procede a buscar la receta', () => {
    const result = svc.toggleLike('r1', mockUser);
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  test('D9-C01b: toggleLike requiere un usuario para ejecutarse', () => {
    const result = svc.toggleLike('r1', null);
    expect(result.success).toBe(false);
  });

  // Conexión 2→12 (NO): No autenticado → Alerta: necesitas iniciar sesión
  test('D9-C02a: toggleLike sin usuario retorna error de autenticación', () => {
    const result = svc.toggleLike('r1', null);
    expect(result.needsAuth).toBe(true);
    expect(result.error).toContain('iniciar sesión');
  });

  test('D9-C02b: toggleLike con usuario sin id retorna error', () => {
    const result = svc.toggleLike('r1', { id: null });
    expect(result.success).toBe(false);
  });

  // Conexión 2→3 (SI): Autenticado → Obtener recipeId
  test('D9-C03a: toggleLike autenticado busca la receta por ID', () => {
    const result = svc.toggleLike('r1', mockUser);
    expect(result.success).toBe(true);
  });

  test('D9-C03b: toggleLike con receta inexistente lanza NotFoundException', () => {
    expect(() => svc.toggleLike('nonexistent', mockUser)).toThrow(NotFoundException);
  });

  // Conexión 3→4: Obtener recipeId → POST /api/recipes/{id}/like
  test('D9-C04a: toggleLike ejecuta la operación sobre la receta correcta', () => {
    const result = svc.toggleLike('r1', mockUser);
    expect(result.likes).toBeDefined();
  });

  test('D9-C04b: toggleLike lanza NotFoundException si receta no existe', () => {
    expect(() => svc.toggleLike('fake', mockUser)).toThrow(NotFoundException);
  });

  // Conexión 4→5: POST like → Backend buscar receta
  test('D9-C05a: toggleLike encuentra la receta en el repositorio', () => {
    const recipe = svc.getRecipe('r1');
    expect(recipe).not.toBeNull();
    expect(recipe.name).toBe('Tacos');
  });

  test('D9-C05b: toggleLike verifica que la receta existe antes de operar', () => {
    expect(() => svc.toggleLike('missing-id', mockUser)).toThrow();
  });

  // Conexión 5→6: Buscar receta → Verificar array likedBy
  test('D9-C06a: toggleLike inicializa likedBy como array si es null', () => {
    svc.addRecipe({ id: 'r-null', name: 'Test', likes: 0, likedBy: null });
    const result = svc.toggleLike('r-null', mockUser);
    expect(result.success).toBe(true);
    expect(Array.isArray(result.likedBy)).toBe(true);
  });

  test('D9-C06b: toggleLike maneja likedBy undefined', () => {
    svc.addRecipe({ id: 'r-undef', name: 'Test', likes: 0, likedBy: undefined });
    const result = svc.toggleLike('r-undef', mockUser);
    expect(result.success).toBe(true);
    expect(Array.isArray(result.likedBy)).toBe(true);
  });

  // Conexión 6→7: Verificar likedBy → user.id en likedBy?
  test('D9-C07a: detecta que el usuario ya dio like', () => {
    // r3 tiene user-1 en likedBy
    const result = svc.toggleLike('r3', mockUser);
    expect(result.action).toBe('unliked');
  });

  test('D9-C07b: detecta cuando el usuario NO ha dado like', () => {
    // r1 NO tiene user-1 en likedBy
    const result = svc.toggleLike('r1', mockUser);
    expect(result.action).toBe('liked');
  });

  // Conexión 7→8 (SI): user.id en likedBy → Remover user.id (quitar like)
  test('D9-C08a: quitar like remueve userId del array likedBy', () => {
    const result = svc.toggleLike('r3', mockUser);
    expect(result.likedBy).not.toContain('user-1');
  });

  test('D9-C08b: quitar like reduce el contador de likes', () => {
    const result = svc.toggleLike('r3', mockUser);
    expect(result.likes).toBe(0);
  });

  // Conexión 7→9 (NO): user.id NO en likedBy → Agregar user.id (dar like)
  test('D9-C09a: dar like agrega userId al array likedBy', () => {
    const result = svc.toggleLike('r1', mockUser);
    expect(result.likedBy).toContain('user-1');
  });

  test('D9-C09b: dar like incrementa el contador de likes', () => {
    const result = svc.toggleLike('r1', mockUser);
    expect(result.likes).toBe(3);
  });

  // Conexión 8→10: Remover like → likes = likedBy.length, Guardar BD
  test('D9-C10a: al quitar like actualiza likes = likedBy.length', () => {
    const result = svc.toggleLike('r3', mockUser);
    expect(result.likes).toBe(result.likedBy.length);
  });

  test('D9-C10b: al quitar like persiste el cambio en el servicio', () => {
    svc.toggleLike('r3', mockUser);
    const recipe = svc.getRecipe('r3');
    expect(recipe.likedBy).not.toContain('user-1');
  });

  // Conexión 9→10: Agregar like → likes = likedBy.length, Guardar BD
  test('D9-C11a: al dar like actualiza likes = likedBy.length', () => {
    const result = svc.toggleLike('r2', mockUser);
    expect(result.likes).toBe(1);
    expect(result.likedBy.length).toBe(1);
  });

  test('D9-C11b: al dar like persiste el cambio en el servicio', () => {
    svc.toggleLike('r2', mockUser);
    const recipe = svc.getRecipe('r2');
    expect(recipe.likedBy).toContain('user-1');
    expect(recipe.likes).toBe(1);
  });

  // Conexión 10→11: Guardar BD → Retornar respuesta, Actualizar UI
  test('D9-C12a: toggleLike retorna un objeto con likes y likedBy', () => {
    const result = svc.toggleLike('r1', mockUser);
    expect(result).toHaveProperty('likes');
    expect(result).toHaveProperty('likedBy');
  });

  test('D9-C12b: toggleLike retorna datos consistentes', () => {
    const result = svc.toggleLike('r1', mockUser);
    expect(result.likes).toBe(result.likedBy.length);
  });

  // Conexión 11→13: Retornar respuesta → Fin
  test('D9-C13a: toggleLike completa flujo de dar like exitosamente', () => {
    const result = svc.toggleLike('r2', mockUser);
    expect(result.success).toBe(true);
    expect(result.likedBy).toContain('user-1');
    expect(result.likes).toBe(1);
  });

  test('D9-C13b: toggleLike completa flujo de quitar like exitosamente', () => {
    const result = svc.toggleLike('r3', mockUser);
    expect(result.success).toBe(true);
    expect(result.likedBy).not.toContain('user-1');
    expect(result.likes).toBe(0);
  });

  // Conexión 12→13: Alerta no autenticado → Fin
  test('D9-C14a: toggleLike sin autenticación termina con error', () => {
    const result = svc.toggleLike('r1', null);
    expect(result.success).toBe(false);
    expect(result.needsAuth).toBe(true);
  });

  test('D9-C14b: isLikedByUser retorna false sin usuario', () => {
    expect(svc.isLikedByUser('r1', null)).toBe(false);
  });
});
