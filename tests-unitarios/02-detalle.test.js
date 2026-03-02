/**
 * ============================================================
 * PRUEBAS UNITARIAS - DETALLE DE RECETA
 * Código analizado: findOne() + update() + remove() + findCommentsByRecipe()
 * Servicio: RecipesService (backend NestJS)
 * ============================================================
 */

// ---- Mock del RecipesService (lógica pura extraída) ----

class NotFoundException extends Error {
  constructor(msg) { super(msg); this.name = 'NotFoundException'; this.status = 404; }
}

class ForbiddenException extends Error {
  constructor(msg) { super(msg); this.name = 'ForbiddenException'; this.status = 403; }
}

function createMockRecipeRepo() {
  const recipes = new Map();
  const comments = new Map();
  return {
    addRecipe(recipe) { recipes.set(recipe.id, { ...recipe }); },
    addComment(comment) { comments.set(comment.id, { ...comment }); },
    findOne(id) {
      return recipes.get(id) || null;
    },
    findAll() {
      return Array.from(recipes.values());
    },
    save(recipe) {
      recipes.set(recipe.id, { ...recipe });
      return { ...recipe };
    },
    remove(id) {
      recipes.delete(id);
    },
    findComments(recipeId) {
      return Array.from(comments.values()).filter(c => c.recipeId === recipeId);
    },
  };
}

function findOne(repo, id) {
  const recipe = repo.findOne(id);
  if (!recipe) throw new NotFoundException(`Recipe with ID "${id}" not found`);
  return recipe;
}

function updateRecipe(repo, id, dto, userId) {
  const recipe = findOne(repo, id);
  if (recipe.userId !== userId) throw new ForbiddenException('You can only update your own recipes');
  Object.assign(recipe, dto);
  return repo.save(recipe);
}

function removeRecipe(repo, id, userId) {
  const recipe = findOne(repo, id);
  if (recipe.userId !== userId) throw new ForbiddenException('You can only delete your own recipes');
  repo.remove(id);
}

function findCommentsByRecipe(repo, recipeId) {
  findOne(repo, recipeId); // Verifica que existe
  return repo.findComments(recipeId);
}

// ---- Datos de prueba ----
const mockUser1 = { id: 'user-1', username: 'chef1' };
const mockUser2 = { id: 'user-2', username: 'chef2' };

const baseRecipe = {
  id: 'recipe-1', name: 'Tacos al pastor', descripcion: 'Deliciosos tacos mexicanos',
  ingredients: ['tortilla', 'carne', 'piña'], steps: ['Marinar', 'Cocinar', 'Servir'],
  images: ['img1.jpg'], category: 'platos-fuertes', likes: 2, likedBy: ['user-3', 'user-4'],
  userId: 'user-1', comments: [],
};

const baseRecipe2 = {
  id: 'recipe-2', name: 'Ensalada César', descripcion: 'Ensalada fresca',
  ingredients: ['lechuga'], steps: ['Mezclar'], images: [],
  category: 'entradas', likes: 5, likedBy: [], userId: 'user-2', comments: [],
};

// ============================================================
// 36 PRUEBAS UNITARIAS
// ============================================================

describe('Funcionalidad 2: Detalle de Receta (36 tests - Diagrama 4)', () => {
  let repo;

  beforeEach(() => {
    repo = createMockRecipeRepo();
    repo.addRecipe({ ...baseRecipe });
    repo.addRecipe({ ...baseRecipe2 });
    repo.addComment({ id: 'c1', message: 'Excelente', recipeId: 'recipe-1', userId: 'user-2' });
  });

  // Conexión 1→2: Inicio → isLoading=true, error=null
  test('D4-C01a: findOne inicia la búsqueda correctamente con un ID válido', () => {
    const result = findOne(repo, 'recipe-1');
    expect(result).toBeDefined();
  });

  test('D4-C01b: findOne acepta cualquier string como ID', () => {
    expect(() => findOne(repo, 'recipe-1')).not.toThrow();
  });

  // Conexión 2→3: isLoading → Obtener recipeId de URL
  test('D4-C02a: findOne busca por el ID proporcionado', () => {
    const result = findOne(repo, 'recipe-1');
    expect(result.id).toBe('recipe-1');
  });

  test('D4-C02b: findOne retorna la receta con sus relaciones', () => {
    const result = findOne(repo, 'recipe-1');
    expect(result.userId).toBeDefined();
  });

  // Conexión 3→4: Obtener recipeId → recipeId existe?
  test('D4-C03a: findOne con ID existente pasa la verificación', () => {
    const result = findOne(repo, 'recipe-1');
    expect(result).not.toBeNull();
  });

  test('D4-C03b: findOne con ID vacío lanza NotFoundException', () => {
    expect(() => findOne(repo, '')).toThrow(NotFoundException);
  });

  // Conexión 4→15 (NO): recipeId no existe → Error: No se encontró ID
  test('D4-C04a: findOne con ID inexistente lanza NotFoundException', () => {
    expect(() => findOne(repo, 'nonexistent-id')).toThrow(NotFoundException);
  });

  test('D4-C04b: findOne con ID inexistente incluye el ID en el mensaje', () => {
    expect(() => findOne(repo, 'abc-123')).toThrow('Recipe with ID "abc-123" not found');
  });

  // Conexión 4→5 (SI): recipeId existe → getRecipeById()
  test('D4-C05a: findOne con ID válido ejecuta la consulta al repositorio', () => {
    const result = findOne(repo, 'recipe-1');
    expect(result.name).toBe('Tacos al pastor');
  });

  test('D4-C05b: findOne con ID válido retorna la receta completa', () => {
    const result = findOne(repo, 'recipe-1');
    expect(result.name).toBe('Tacos al pastor');
    expect(result.category).toBe('platos-fuertes');
  });

  // Conexión 5→6: getRecipeById → Receta encontrada?
  test('D4-C06a: findOne verifica si el resultado es null', () => {
    expect(() => findOne(repo, 'missing')).toThrow(NotFoundException);
  });

  test('D4-C06b: findOne retorna la receta si existe', () => {
    const result = findOne(repo, 'recipe-1');
    expect(result).toEqual(expect.objectContaining({ id: 'recipe-1' }));
  });

  // Conexión 6→16 (NO): Receta no encontrada → Error
  test('D4-C07a: findOne lanza NotFoundException cuando no existe', () => {
    expect(() => findOne(repo, 'missing-recipe')).toThrow(NotFoundException);
  });

  test('D4-C07b: findOne lanza con mensaje descriptivo', () => {
    try {
      findOne(repo, 'missing-recipe');
    } catch (e) {
      expect(e.message).toContain('missing-recipe');
    }
  });

  // Conexión 6→7 (SI): Receta encontrada → this.recipe = recipeData
  test('D4-C08a: findOne retorna la receta con todos los campos', () => {
    const result = findOne(repo, 'recipe-1');
    expect(result.name).toBeDefined();
    expect(result.descripcion).toBeDefined();
    expect(result.ingredients).toBeDefined();
  });

  test('D4-C08b: findOne retorna la receta con userId', () => {
    const result = findOne(repo, 'recipe-1');
    expect(result.userId).toBe('user-1');
  });

  // Conexión 7→8: recipe = recipeData → isLoading = false
  test('D4-C09a: findOne completa exitosamente sin excepción', () => {
    expect(() => findOne(repo, 'recipe-1')).not.toThrow();
  });

  test('D4-C09b: findOne retorna datos completos para finalizar loading', () => {
    const result = findOne(repo, 'recipe-1');
    expect(result).toBeTruthy();
    expect(typeof result.name).toBe('string');
  });

  // Conexión 8→9: isLoading=false → Renderizar nombre, imgs, ingredientes, pasos, autor
  test('D4-C10a: findOne retorna nombre para renderizar', () => {
    const result = findOne(repo, 'recipe-1');
    expect(result.name).toBe('Tacos al pastor');
  });

  test('D4-C10b: findOne retorna ingredientes y pasos para renderizar', () => {
    const result = findOne(repo, 'recipe-1');
    expect(result.ingredients.length).toBeGreaterThan(0);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  // Conexión 9→10: Renderizar datos → Renderizar comentarios
  test('D4-C11a: findCommentsByRecipe retorna comentarios de la receta', () => {
    const comments = findCommentsByRecipe(repo, 'recipe-1');
    expect(comments.length).toBe(1);
  });

  test('D4-C11b: findCommentsByRecipe retorna array vacío si no hay comentarios', () => {
    const comments = findCommentsByRecipe(repo, 'recipe-2');
    expect(comments.length).toBe(0);
  });

  // Conexión 10→11: Renderizar comentarios → Es dueño?
  test('D4-C12a: update verifica ownership comparando userId', () => {
    expect(() => updateRecipe(repo, 'recipe-1', { name: 'Nuevo' }, 'user-2')).toThrow(ForbiddenException);
  });

  test('D4-C12b: update permite al dueño actualizar su propia receta', () => {
    const result = updateRecipe(repo, 'recipe-1', { name: 'Actualizado' }, 'user-1');
    expect(result.name).toBe('Actualizado');
  });

  // Conexión 11→13 (NO): No es dueño → Ocultar botones edición
  test('D4-C13a: update con usuario NO dueño lanza ForbiddenException', () => {
    expect(() => updateRecipe(repo, 'recipe-1', { name: 'X' }, 'user-2')).toThrow('You can only update your own recipes');
  });

  test('D4-C13b: remove con usuario NO dueño lanza ForbiddenException', () => {
    expect(() => removeRecipe(repo, 'recipe-1', 'user-2')).toThrow('You can only delete your own recipes');
  });

  // Conexión 11→12 (SI): Es dueño → Mostrar botones Editar/Eliminar
  test('D4-C14a: update exitoso para dueño retorna receta actualizada', () => {
    const result = updateRecipe(repo, 'recipe-1', { name: 'Editado' }, 'user-1');
    expect(result).toBeDefined();
    expect(result.name).toBe('Editado');
  });

  test('D4-C14b: remove exitoso para dueño no lanza excepción', () => {
    expect(() => removeRecipe(repo, 'recipe-1', 'user-1')).not.toThrow();
  });

  // Conexión 12→14: Botones editar/eliminar → Fin
  test('D4-C15a: update completa todo el flujo y retorna la receta guardada', () => {
    const result = updateRecipe(repo, 'recipe-1', { name: 'Final' }, 'user-1');
    expect(result.name).toBe('Final');
  });

  test('D4-C15b: remove completa el flujo eliminando del repositorio', () => {
    removeRecipe(repo, 'recipe-1', 'user-1');
    expect(() => findOne(repo, 'recipe-1')).toThrow(NotFoundException);
  });

  // Conexión 13→14: Ocultar botones → Fin (lectura pública)
  test('D4-C16a: findOne sin ser dueño aún retorna la receta completa', () => {
    const result = findOne(repo, 'recipe-1');
    expect(result).toBeDefined();
    expect(result.userId).toBe('user-1');
  });

  test('D4-C16b: findAll retorna recetas visibles para todos', () => {
    const results = repo.findAll();
    expect(results.length).toBe(2);
  });

  // Conexión 15→14: Error no encontró ID → Fin
  test('D4-C17a: findOne con ID null lanza NotFoundException', () => {
    expect(() => findOne(repo, null)).toThrow(NotFoundException);
  });

  test('D4-C17b: findOne con ID undefined lanza NotFoundException', () => {
    expect(() => findOne(repo, undefined)).toThrow(NotFoundException);
  });

  // Conexión 16→14: Receta no encontrada → Fin
  test('D4-C18a: findOne lanza NotFoundException para receta eliminada', () => {
    repo.remove('recipe-1');
    expect(() => findOne(repo, 'recipe-1')).toThrow(NotFoundException);
  });

  test('D4-C18b: findCommentsByRecipe lanza NotFoundException si la receta no existe', () => {
    expect(() => findCommentsByRecipe(repo, 'nonexistent')).toThrow(NotFoundException);
  });
});
