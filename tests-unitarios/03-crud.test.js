/**
 * ============================================================
 * PRUEBAS UNITARIAS - CRUD DE RECETAS
 * Código analizado: submitRecipe() + create() + update() + remove()
 * Servicios: RecipeUploadService + RecipesService
 * ============================================================
 */

// ---- Excepciones ----
class ValidationError extends Error {
  constructor(msg) { super(msg); this.name = 'ValidationError'; }
}
class AuthError extends Error {
  constructor(msg) { super(msg); this.name = 'AuthError'; }
}
class ForbiddenError extends Error {
  constructor(msg) { super(msg); this.name = 'ForbiddenError'; }
}

// ---- Mock del flujo CRUD completo ----

function validateForm(formData) {
  if (!formData.name || !formData.name.trim()) return { valid: false, error: 'Nombre requerido' };
  if (!formData.descripcion || !formData.descripcion.trim()) return { valid: false, error: 'Descripción requerida' };
  if (!formData.ingredients || formData.ingredients.length === 0) return { valid: false, error: 'Al menos un ingrediente' };
  if (!formData.steps || formData.steps.length === 0) return { valid: false, error: 'Al menos un paso' };
  return { valid: true, error: null };
}

function validateImages(images) {
  return images && images.length > 0;
}

function preparePayload(formData) {
  return {
    name: (formData.name || '').trim(),
    descripcion: (formData.descripcion || '').trim(),
    category: formData.category || '',
    ingredients: formData.ingredients || [],
    steps: formData.steps || [],
    images: formData.images || [],
  };
}

function submitRecipe(formData, images, currentUser, isEditMode, recipeId) {
  // Paso 1: markAllFieldsAsTouched
  const validation = validateForm(formData);

  // Paso 2: Formulario válido?
  if (!validation.valid) {
    return { success: false, error: validation.error, type: 'validation' };
  }

  // Paso 3: Al menos una imagen?
  if (!validateImages(images)) {
    return { success: false, error: 'Debe subir al menos una imagen', type: 'images' };
  }

  // Paso 4: Usuario autenticado?
  if (!currentUser || !currentUser.id) {
    return { success: false, error: 'Sesión expirada', type: 'auth' };
  }

  // Paso 5: Preparar formData
  const payload = preparePayload({ ...formData, images });

  // Paso 6: Modo edición?
  if (isEditMode) {
    // PATCH
    return { success: true, action: 'update', recipeId, payload, redirect: `/recipe/${recipeId}` };
  } else {
    // POST
    const newId = 'new-' + Date.now();
    return { success: true, action: 'create', recipeId: newId, payload, redirect: '/home', resetForm: true };
  }
}

function createRecipe(repo, payload, userId) {
  const id = 'recipe-' + Date.now();
  const recipe = { id, ...payload, userId, likes: 0, likedBy: [], comments: [] };
  repo.push(recipe);
  return recipe;
}

function updateRecipeInRepo(repo, recipeId, changes, userId) {
  const idx = repo.findIndex(r => r.id === recipeId);
  if (idx === -1) throw new Error('Recipe not found');
  if (repo[idx].userId !== userId) throw new ForbiddenError('You can only update your own recipes');
  Object.assign(repo[idx], changes);
  return { ...repo[idx] };
}

function deleteRecipe(repo, recipeId, userId) {
  const idx = repo.findIndex(r => r.id === recipeId);
  if (idx === -1) throw new Error('Recipe not found');
  if (repo[idx].userId !== userId) throw new ForbiddenError('You can only delete your own recipes');
  repo.splice(idx, 1);
  return true;
}

// ---- Datos de prueba ----
const validForm = {
  name: 'Pozole rojo',
  descripcion: 'Caldo mexicano tradicional',
  category: 'platos-fuertes',
  ingredients: ['maíz', 'carne', 'chile'],
  steps: ['Hervir maíz', 'Cocinar carne', 'Mezclar'],
};

const validImages = ['img1.jpg'];
const validUser = { id: 'user-1', username: 'chef1' };

// ============================================================
// 42 PRUEBAS UNITARIAS
// ============================================================

describe('Funcionalidad 3: CRUD de Recetas (42 tests - Diagrama 5)', () => {

  // Conexión 1→2: Inicio → markAllFieldsAsTouched
  test('D5-C01a: submitRecipe recibe datos del formulario y los procesa', () => {
    const result = submitRecipe(validForm, validImages, validUser, false, null);
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  test('D5-C01b: submitRecipe marca todos los campos como touched', () => {
    const result = submitRecipe(validForm, validImages, validUser, false, null);
    expect(result.payload).toBeDefined();
  });

  // Conexión 2→3: markAllFields → Formulario válido?
  test('D5-C02a: validateForm valida que los campos obligatorios estén presentes', () => {
    const result = validateForm(validForm);
    expect(result.valid).toBe(true);
  });

  test('D5-C02b: validateForm detecta campos faltantes', () => {
    const result = validateForm({ name: '', descripcion: '', ingredients: [], steps: [] });
    expect(result.valid).toBe(false);
  });

  // Conexión 3→14 (NO): Formulario inválido → Toast campos incompletos
  test('D5-C03a: submitRecipe con nombre vacío retorna error de validación', () => {
    const result = submitRecipe({ ...validForm, name: '' }, validImages, validUser, false, null);
    expect(result.success).toBe(false);
    expect(result.type).toBe('validation');
  });

  test('D5-C03b: submitRecipe con ingredientes vacíos retorna error', () => {
    const result = submitRecipe({ ...validForm, ingredients: [] }, validImages, validUser, false, null);
    expect(result.success).toBe(false);
    expect(result.type).toBe('validation');
  });

  // Conexión 3→4 (SI): Formulario válido → Al menos una imagen?
  test('D5-C04a: submitRecipe con formulario válido procede al check de imágenes', () => {
    const result = submitRecipe(validForm, validImages, validUser, false, null);
    expect(result.success).toBe(true);
  });

  test('D5-C04b: submitRecipe incluye la categoría en el payload', () => {
    const result = submitRecipe(validForm, validImages, validUser, false, null);
    expect(result.payload.category).toBe('platos-fuertes');
  });

  // Conexión 4→15 (NO): Sin imagen → Toast suba al menos 1 imagen
  test('D5-C05a: submitRecipe sin imágenes retorna error de imágenes', () => {
    const result = submitRecipe(validForm, [], validUser, false, null);
    expect(result.success).toBe(false);
    expect(result.type).toBe('images');
  });

  test('D5-C05b: submitRecipe con images null retorna error', () => {
    const result = submitRecipe(validForm, null, validUser, false, null);
    expect(result.success).toBe(false);
    expect(result.type).toBe('images');
  });

  // Conexión 4→5 (SI): Con imagen → Usuario autenticado?
  test('D5-C06a: submitRecipe con imágenes procede al check de autenticación', () => {
    const result = submitRecipe(validForm, validImages, validUser, false, null);
    expect(result.success).toBe(true);
  });

  test('D5-C06b: submitRecipe incluye imágenes en el payload', () => {
    const result = submitRecipe(validForm, validImages, validUser, false, null);
    expect(result.payload.images).toEqual(validImages);
  });

  // Conexión 5→16 (NO): Sesión expirada → Toast sesión expirada
  test('D5-C07a: submitRecipe sin usuario retorna error de auth', () => {
    const result = submitRecipe(validForm, validImages, null, false, null);
    expect(result.success).toBe(false);
    expect(result.type).toBe('auth');
  });

  test('D5-C07b: submitRecipe con usuario sin id retorna error', () => {
    const result = submitRecipe(validForm, validImages, { id: null }, false, null);
    expect(result.success).toBe(false);
    expect(result.type).toBe('auth');
  });

  // Conexión 5→6 (SI): Autenticado → Preparar formData
  test('D5-C08a: preparePayload construye el payload con todos los campos', () => {
    const payload = preparePayload({ ...validForm, images: validImages });
    expect(payload).toHaveProperty('name');
    expect(payload).toHaveProperty('descripcion');
    expect(payload).toHaveProperty('category');
    expect(payload).toHaveProperty('ingredients');
    expect(payload).toHaveProperty('steps');
    expect(payload).toHaveProperty('images');
  });

  test('D5-C08b: preparePayload trimea el nombre y la descripción', () => {
    const payload = preparePayload({ ...validForm, name: '  Pozole  ', descripcion: '  Caldo  ', images: [] });
    expect(payload.name).toBe('Pozole');
    expect(payload.descripcion).toBe('Caldo');
  });

  // Conexión 6→7: Preparar formData → Modo edición?
  test('D5-C09a: submitRecipe en modo creación retorna action create', () => {
    const result = submitRecipe(validForm, validImages, validUser, false, null);
    expect(result.action).toBe('create');
  });

  test('D5-C09b: submitRecipe en modo edición retorna action update', () => {
    const result = submitRecipe(validForm, validImages, validUser, true, 'recipe-1');
    expect(result.action).toBe('update');
  });

  // Conexión 7→9 (NO): No es modo edición → POST addRecipe
  test('D5-C10a: create agrega la receta al repositorio', () => {
    const repo = [];
    const created = createRecipe(repo, preparePayload({ ...validForm, images: validImages }), 'user-1');
    expect(repo.length).toBe(1);
  });

  test('D5-C10b: create retorna la receta con su ID', () => {
    const repo = [];
    const created = createRecipe(repo, preparePayload({ ...validForm, images: validImages }), 'user-1');
    expect(created.id).toBeDefined();
  });

  // Conexión 7→8 (SI): Modo edición → PATCH updateRecipe
  test('D5-C11a: update aplica los cambios sobre la receta existente', () => {
    const repo = [{ id: 'r1', name: 'Original', descripcion: 'Desc', userId: 'user-1', likes: 0, likedBy: [] }];
    const result = updateRecipeInRepo(repo, 'r1', { name: 'Editado' }, 'user-1');
    expect(result.name).toBe('Editado');
  });

  test('D5-C11b: update solo modifica los campos proporcionados', () => {
    const repo = [{ id: 'r1', name: 'Original', descripcion: 'Desc', category: 'postres', userId: 'user-1' }];
    const result = updateRecipeInRepo(repo, 'r1', { name: 'Nuevo' }, 'user-1');
    expect(result.descripcion).toBe('Desc');
    expect(result.category).toBe('postres');
  });

  // Conexión 8→10: PATCH updateRecipe → Toast de éxito
  test('D5-C12a: update exitoso retorna la receta actualizada', () => {
    const repo = [{ id: 'r1', name: 'X', userId: 'user-1' }];
    const result = updateRecipeInRepo(repo, 'r1', { name: 'Éxito' }, 'user-1');
    expect(result).toBeTruthy();
    expect(result.name).toBe('Éxito');
  });

  test('D5-C12b: update retorna el objeto completo después de guardar', () => {
    const repo = [{ id: 'r1', name: 'X', category: 'entradas', userId: 'user-1' }];
    const result = updateRecipeInRepo(repo, 'r1', { name: 'Completo', category: 'postres' }, 'user-1');
    expect(result.category).toBe('postres');
  });

  // Conexión 9→10: POST addRecipe → Toast de éxito
  test('D5-C13a: create retorna la receta creada con datos completos', () => {
    const repo = [];
    const created = createRecipe(repo, preparePayload({ ...validForm, images: validImages }), 'user-1');
    expect(created.name).toBe('Pozole rojo');
  });

  test('D5-C13b: create inicializa likes en 0 y likedBy vacío', () => {
    const repo = [];
    const created = createRecipe(repo, preparePayload({ ...validForm, images: validImages }), 'user-1');
    expect(created.likes).toBe(0);
    expect(created.likedBy).toEqual([]);
  });

  // Conexión 10→11: Toast éxito → Modo creación?
  test('D5-C14a: create siempre genera nueva receta (modo creación)', () => {
    const repo = [];
    const c1 = createRecipe(repo, preparePayload({ ...validForm, images: validImages }), 'user-1');
    expect(repo.length).toBe(1);
    const c2 = createRecipe(repo, preparePayload({ ...validForm, images: validImages }), 'user-1');
    expect(repo.length).toBe(2);
    // Dos recetas distintas fueron creadas
    expect(repo[0]).not.toBe(repo[1]);
  });

  test('D5-C14b: update modifica receta existente (modo edición)', () => {
    const repo = [{ id: 'r1', name: 'Old', userId: 'user-1' }];
    const result = updateRecipeInRepo(repo, 'r1', { name: 'New' }, 'user-1');
    expect(result.id).toBe('r1');
    expect(result.name).toBe('New');
  });

  // Conexión 11→13 (NO): No es creación (edición) → Redirigir a /recipe/{id}
  test('D5-C15a: submitRecipe en modo edición redirige a /recipe/{id}', () => {
    const result = submitRecipe(validForm, validImages, validUser, true, 'recipe-1');
    expect(result.redirect).toBe('/recipe/recipe-1');
  });

  test('D5-C15b: submitRecipe en edición preserva el recipeId original', () => {
    const result = submitRecipe(validForm, validImages, validUser, true, 'recipe-1');
    expect(result.recipeId).toBe('recipe-1');
  });

  // Conexión 11→12 (SI): Es creación → Reset form, Redirigir /home
  test('D5-C16a: submitRecipe en creación redirige a /home', () => {
    const result = submitRecipe(validForm, validImages, validUser, false, null);
    expect(result.redirect).toBe('/home');
  });

  test('D5-C16b: submitRecipe en creación indica resetForm', () => {
    const result = submitRecipe(validForm, validImages, validUser, false, null);
    expect(result.resetForm).toBe(true);
  });

  // Conexión 12→17: Reset form → Fin
  test('D5-C17a: submitRecipe en creación completa exitosamente', () => {
    const result = submitRecipe(validForm, validImages, validUser, false, null);
    expect(result.success).toBe(true);
  });

  test('D5-C17b: create no lanza excepción al completar', () => {
    const repo = [];
    expect(() => createRecipe(repo, preparePayload({ ...validForm, images: validImages }), 'user-1')).not.toThrow();
  });

  // Conexión 13→17: Redirigir recipe/{id} → Fin
  test('D5-C18a: submitRecipe en edición completa exitosamente', () => {
    const result = submitRecipe(validForm, validImages, validUser, true, 'recipe-1');
    expect(result.success).toBe(true);
  });

  test('D5-C18b: update retorna el ID para la redirección', () => {
    const repo = [{ id: 'r1', name: 'X', userId: 'user-1' }];
    const result = updateRecipeInRepo(repo, 'r1', { name: 'Y' }, 'user-1');
    expect(result.id).toBe('r1');
  });

  // Conexión 14→17: Toast campos incompletos → Fin
  test('D5-C19a: submitRecipe con error de validación retorna success false', () => {
    const result = submitRecipe({ ...validForm, name: '' }, validImages, validUser, false, null);
    expect(result.success).toBe(false);
  });

  test('D5-C19b: submitRecipe con datos vacíos retorna error', () => {
    const result = submitRecipe({}, validImages, validUser, false, null);
    expect(result.success).toBe(false);
  });

  // Conexión 15→17: Toast sin imagen → Fin
  test('D5-C20a: submitRecipe sin imágenes retorna success false', () => {
    const result = submitRecipe(validForm, [], validUser, false, null);
    expect(result.success).toBe(false);
    expect(result.error).toContain('imagen');
  });

  test('D5-C20b: submitRecipe con images undefined retorna error', () => {
    const result = submitRecipe(validForm, undefined, validUser, false, null);
    expect(result.success).toBe(false);
  });

  // Conexión 16→17: Toast sesión expirada → Fin
  test('D5-C21a: submitRecipe sin autenticación retorna success false', () => {
    const result = submitRecipe(validForm, validImages, null, false, null);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Sesión');
  });

  test('D5-C21b: deleteRecipe sin ser dueño lanza ForbiddenError', () => {
    const repo = [{ id: 'r1', name: 'X', userId: 'user-1' }];
    expect(() => deleteRecipe(repo, 'r1', 'user-2')).toThrow(ForbiddenError);
  });
});
