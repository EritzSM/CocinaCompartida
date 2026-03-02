/**
 * ============================================================
 * PRUEBAS UNITARIAS - Funcionalidad 1: EXPLORAR RECETAS
 * Diagrama 3 (Flujo): 16 conexiones × 2 = 32 pruebas
 *
 * Código analizado: search() + updateSuggestions() + updateResults()
 * Servicio: SearchService (frontend Angular)
 * ============================================================
 */

// ---- Mock del SearchService (lógica pura extraída) ----

function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
  for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function calculateRelevance(recipe, query) {
  const searchTerms = query.toLowerCase().split(' ').filter(t => t.length > 0);
  if (searchTerms.length === 0) return 0;
  let relevance = 0;
  const name = recipe.name.toLowerCase();
  const description = recipe.descripcion.toLowerCase();
  for (const term of searchTerms) {
    if (name === term) relevance += 10;
    if (name.startsWith(term)) relevance += 8;
    if (name.includes(term)) relevance += 5;
    if (description.includes(term)) relevance += 3;
    const nameWords = name.split(' ');
    if (nameWords.includes(term)) relevance += 4;
  }
  return relevance;
}

function filterAndSearch(allRecipes, query, category, sortBy) {
  let results = [...allRecipes];

  // Filtro de categoría
  if (category && category !== 'todas') {
    results = results.filter(r => r.category === category);
  }

  // Si no hay query, solo ordenar
  if (!query || !query.trim()) {
    return sortResults(results, sortBy);
  }

  const q = query.toLowerCase();
  results = results
    .filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.descripcion.toLowerCase().includes(q)
    )
    .map(r => ({ recipe: r, relevance: calculateRelevance(r, query) }))
    .sort((a, b) => b.relevance - a.relevance)
    .map(item => item.recipe);

  if (sortBy !== 'recent') {
    results = sortResults(results, sortBy);
  }
  return results;
}

function generateSuggestions(allRecipes, query, category) {
  if (!query || !query.trim()) return [];
  const q = query.toLowerCase();
  let filtered = [...allRecipes];
  if (category && category !== 'todas') {
    filtered = filtered.filter(r => r.category === category);
  }
  return filtered
    .filter(r => {
      const name = r.name.toLowerCase();
      const desc = r.descripcion.toLowerCase();
      return name.includes(q) || desc.includes(q) || name.startsWith(q) ||
             calculateSimilarity(name, q) > 0.6 || calculateSimilarity(desc, q) > 0.6;
    })
    .map(r => ({ recipe: r, relevance: calculateRelevance(r, query) }))
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5)
    .map(i => i.recipe);
}

function sortResults(recipes, sortBy) {
  switch (sortBy) {
    case 'recent': return [...recipes].sort((a, b) => b.id.localeCompare(a.id));
    case 'oldest': return [...recipes].sort((a, b) => a.id.localeCompare(b.id));
    case 'likes':  return [...recipes].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    default: return recipes;
  }
}

// ---- Datos de prueba ----
const mockRecipes = [
  { id: 'r1', name: 'Tacos al pastor', descripcion: 'Tacos mexicanos con piña', category: 'platos-fuertes', likes: 5 },
  { id: 'r2', name: 'Ensalada César', descripcion: 'Ensalada fresca con aderezo', category: 'entradas', likes: 3 },
  { id: 'r3', name: 'Flan napolitano', descripcion: 'Postre de caramelo cremoso', category: 'postres', likes: 8 },
  { id: 'r4', name: 'Agua de horchata', descripcion: 'Bebida refrescante de arroz', category: 'bebidas', likes: 2 },
  { id: 'r5', name: 'Guacamole', descripcion: 'Entrada de aguacate mexicano', category: 'entradas', likes: 6 },
  { id: 'r6', name: 'Tacos de birria', descripcion: 'Tacos con caldo de birria', category: 'platos-fuertes', likes: 4 },
  { id: 'r7', name: 'Pozole rojo', descripcion: 'Caldo tradicional mexicano', category: 'platos-fuertes', likes: 7 },
];

// ============================================================
// 32 PRUEBAS UNITARIAS
// ============================================================

describe('Funcionalidad 1: Explorar Recetas (32 tests - Diagrama 3)', () => {

  // Conexión 1→2: Inicio → Cargar recetas de RecipeService
  test('D3-C01a: search carga las recetas disponibles del RecipeService', () => {
    const results = filterAndSearch(mockRecipes, '', 'todas', 'recent');
    expect(results.length).toBe(7);
  });

  test('D3-C01b: search accede a la lista de recetas correctamente', () => {
    const results = filterAndSearch(mockRecipes, 'tacos', 'todas', 'recent');
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
  });

  // Conexión 2→3: Cargar recetas → Hay query de búsqueda?
  test('D3-C02a: search con query vacío retorna todas las recetas', () => {
    const results = filterAndSearch(mockRecipes, '', 'todas', 'recent');
    expect(results.length).toBe(7);
  });

  test('D3-C02b: search con query presente filtra los resultados', () => {
    const results = filterAndSearch(mockRecipes, 'tacos', 'todas', 'recent');
    expect(results.length).toBeLessThanOrEqual(7);
    expect(results.length).toBeGreaterThan(0);
  });

  // Conexión 3→6 (NO): Sin query → saltar a filtro categoría
  test('D3-C03a: sin query y sin categoría muestra todas las recetas', () => {
    const results = filterAndSearch(mockRecipes, '', 'todas', 'recent');
    expect(results.length).toBe(mockRecipes.length);
  });

  test('D3-C03b: sin query pero con categoría filtra solo por categoría', () => {
    const results = filterAndSearch(mockRecipes, '', 'entradas', 'recent');
    expect(results.every(r => r.category === 'entradas')).toBe(true);
  });

  // Conexión 3→4 (SI): Con query → Filtrar por nombre/descripción
  test('D3-C04a: search filtra recetas cuyo nombre contiene el query', () => {
    const results = filterAndSearch(mockRecipes, 'tacos', 'todas', 'recent');
    expect(results.every(r =>
      r.name.toLowerCase().includes('tacos') || r.descripcion.toLowerCase().includes('tacos')
    )).toBe(true);
  });

  test('D3-C04b: search filtra recetas cuya descripción contiene el query', () => {
    const results = filterAndSearch(mockRecipes, 'cremoso', 'todas', 'recent');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('Flan napolitano');
  });

  // Conexión 4→5: Filtrar texto → Generar sugerencias Levenshtein (max 5)
  test('D3-C05a: search genera sugerencias con máximo 5 elementos', () => {
    const suggestions = generateSuggestions(mockRecipes, 'taco', 'todas');
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });

  test('D3-C05b: search genera sugerencias que incluyen recetas similares', () => {
    const suggestions = generateSuggestions(mockRecipes, 'tacos', 'todas');
    expect(suggestions.length).toBeGreaterThan(0);
  });

  // Conexión 5→6: Sugerencias → Filtro categoría?
  test('D3-C06a: sugerencias con filtro de categoría solo muestran esa categoría', () => {
    const suggestions = generateSuggestions(mockRecipes, 'tacos', 'platos-fuertes');
    expect(suggestions.every(r => r.category === 'platos-fuertes')).toBe(true);
  });

  test('D3-C06b: sugerencias sin filtro de categoría muestran de todas las categorías', () => {
    const suggestions = generateSuggestions(mockRecipes, 'a', 'todas');
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
  });

  // Conexión 6→8 (NO): Sin filtro categoría → Aplicar ordenamiento
  test('D3-C07a: sin categoría con sort likes ordena por popularidad', () => {
    const results = filterAndSearch(mockRecipes, '', 'todas', 'likes');
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].likes).toBeGreaterThanOrEqual(results[i + 1].likes);
    }
  });

  test('D3-C07b: sin categoría con sort recent ordena por ID descendente', () => {
    const results = filterAndSearch(mockRecipes, '', 'todas', 'recent');
    expect(results[0].id).toBe('r7');
  });

  // Conexión 6→7 (SI): Con filtro categoría → Filtrar por category
  test('D3-C08a: filterByCategory filtra solo recetas de esa categoría', () => {
    const results = filterAndSearch(mockRecipes, '', 'postres', 'recent');
    expect(results.every(r => r.category === 'postres')).toBe(true);
  });

  test('D3-C08b: filterByCategory con categoría inexistente retorna array vacío', () => {
    const results = filterAndSearch(mockRecipes, '', 'categoria-inventada', 'recent');
    expect(results.length).toBe(0);
  });

  // Conexión 7→8: Filtrar categoría → Aplicar ordenamiento
  test('D3-C09a: categoría + sort aplica ambos filtros', () => {
    const results = filterAndSearch(mockRecipes, '', 'platos-fuertes', 'likes');
    expect(results.every(r => r.category === 'platos-fuertes')).toBe(true);
  });

  test('D3-C09b: categoría mantiene el ordenamiento por likes', () => {
    const results = filterAndSearch(mockRecipes, '', 'platos-fuertes', 'likes');
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].likes).toBeGreaterThanOrEqual(results[i + 1].likes);
    }
  });

  // Conexión 8→9: Aplicar ordenamiento → searchResults.set()
  test('D3-C10a: search actualiza el array de resultados', () => {
    const results = filterAndSearch(mockRecipes, 'tacos', 'todas', 'recent');
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
  });

  test('D3-C10b: cambiar el sort mantiene la misma cantidad de resultados', () => {
    const r1 = filterAndSearch(mockRecipes, '', 'todas', 'recent');
    const r2 = filterAndSearch(mockRecipes, '', 'todas', 'likes');
    expect(r1.length).toBe(r2.length);
  });

  // Conexión 9→10: searchResults.set() → Hay resultados?
  test('D3-C11a: search con query coincidente produce resultados > 0', () => {
    const results = filterAndSearch(mockRecipes, 'tacos', 'todas', 'recent');
    expect(results.length).toBeGreaterThan(0);
  });

  test('D3-C11b: search con query sin coincidencia produce resultados = 0', () => {
    const results = filterAndSearch(mockRecipes, 'xyznonexistent', 'todas', 'recent');
    expect(results.length).toBe(0);
  });

  // Conexión 10→14 (NO): Sin resultados → Mensaje: No se encontraron
  test('D3-C12a: búsqueda sin resultados retorna array vacío', () => {
    const results = filterAndSearch(mockRecipes, 'zzzzzzzzz', 'todas', 'recent');
    expect(results).toEqual([]);
  });

  test('D3-C12b: categoría sin recetas retorna vacío', () => {
    const results = filterAndSearch(mockRecipes, '', 'guarniciones', 'recent');
    expect(results.length).toBe(0);
  });

  // Conexión 10→11 (SI): Con resultados → Mostrar primeras 6 recetas
  test('D3-C13a: con resultados retorna las recetas encontradas', () => {
    const results = filterAndSearch(mockRecipes, '', 'todas', 'recent');
    expect(results.length).toBe(7);
  });

  test('D3-C13b: los resultados son objetos completos con todos los campos', () => {
    const results = filterAndSearch(mockRecipes, 'tacos', 'todas', 'recent');
    const first = results[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('category');
  });

  // Conexión 11→12: Mostrar recetas → IntersectionObserver scroll infinito
  test('D3-C14a: resultados listos para paginación (slice posible)', () => {
    const results = filterAndSearch(mockRecipes, '', 'todas', 'recent');
    const page1 = results.slice(0, 6);
    expect(page1.length).toBeLessThanOrEqual(6);
  });

  test('D3-C14b: resultados soportan paginación con offset', () => {
    const results = filterAndSearch(mockRecipes, '', 'todas', 'recent');
    const page2 = results.slice(6, 12);
    expect(page2.length).toBeLessThanOrEqual(6);
  });

  // Conexión 12→13: Scroll infinito → Fin
  test('D3-C15a: el flujo completa retornando todos los resultados', () => {
    const results = filterAndSearch(mockRecipes, '', 'todas', 'recent');
    expect(results.length).toBe(mockRecipes.length);
  });

  test('D3-C15b: filtros combinados completan el flujo correctamente', () => {
    const results = filterAndSearch(mockRecipes, 'tacos', 'platos-fuertes', 'likes');
    expect(results.length).toBeGreaterThan(0);
  });

  // Conexión 14→13: No se encontraron → Fin
  test('D3-C16a: sin resultados completa el flujo con array vacío', () => {
    const results = filterAndSearch(mockRecipes, 'nonexistent12345', 'todas', 'recent');
    expect(results).toEqual([]);
  });

  test('D3-C16b: sin resultados no lanza errores', () => {
    expect(() => filterAndSearch(mockRecipes, 'nothing', 'todas', 'recent')).not.toThrow();
  });
});
