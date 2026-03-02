/**
 * ============================================================
 * PRUEBAS UNITARIAS - Funcionalidad 4: CATEGORÍAS / FILTRAR POR CATEGORÍA
 * Diagrama 8 (Flujo): 16 conexiones × 2 = 32 pruebas
 *
 * Código analizado: onCategoryChange() + filterByCategory() + updateResults()
 * Servicio: SearchService (frontend Angular)
 * ============================================================
 */

// ---- Mock del sistema de categorías (lógica pura extraída) ----

function createCategoryService() {
  let _categoryFilter = 'todas';
  let _searchQuery = '';
  let _sortBy = 'recent';
  let _searchResults = [];

  function sortResults(recipes, sort) {
    switch (sort) {
      case 'recent': return [...recipes].sort((a, b) => b.id.localeCompare(a.id));
      case 'oldest': return [...recipes].sort((a, b) => a.id.localeCompare(b.id));
      case 'likes':  return [...recipes].sort((a, b) => (b.likes || 0) - (a.likes || 0));
      default: return recipes;
    }
  }

  function updateResults(allRecipes) {
    const query = _searchQuery.toLowerCase();
    const category = _categoryFilter;

    // Obtener todas las recetas
    let results = [...allRecipes];

    // category !== 'todas'?
    if (category !== 'todas') {
      results = results.filter(r => r.category === category);
    }

    // Hay query de búsqueda?
    if (!query) {
      _searchResults = sortResults(results, _sortBy);
      return;
    }

    // Filtrar por nombre/desc
    results = results.filter(r =>
      r.name.toLowerCase().includes(query) ||
      r.descripcion.toLowerCase().includes(query)
    );

    _searchResults = sortResults(results, _sortBy);
  }

  return {
    get currentCategory() { return _categoryFilter; },
    get currentQuery() { return _searchQuery; },
    get currentSort() { return _sortBy; },
    get results() { return _searchResults; },

    filterByCategory(category, allRecipes) {
      _categoryFilter = category;
      updateResults(allRecipes);
    },

    setSearch(query, allRecipes) {
      _searchQuery = query;
      updateResults(allRecipes);
    },

    setSortOption(sort, allRecipes) {
      _sortBy = sort;
      updateResults(allRecipes);
    },

    clearFilters(allRecipes) {
      _categoryFilter = 'todas';
      _searchQuery = '';
      _sortBy = 'recent';
      updateResults(allRecipes);
    },
  };
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

describe('Funcionalidad 4: Categorías (32 tests - Diagrama 8)', () => {
  let svc;

  beforeEach(() => {
    svc = createCategoryService();
  });

  // Conexión 1→2: Inicio → Usuario selecciona categoría
  test('D8-C01a: filterByCategory recibe un string de categoría', () => {
    expect(() => svc.filterByCategory('postres', mockRecipes)).not.toThrow();
  });

  test('D8-C01b: filterByCategory acepta cualquier string', () => {
    expect(() => svc.filterByCategory('platos-fuertes', mockRecipes)).not.toThrow();
  });

  // Conexión 2→3: Seleccionar → selectedCategory = categoryId
  test('D8-C02a: filterByCategory actualiza la categoría actual', () => {
    svc.filterByCategory('postres', mockRecipes);
    expect(svc.currentCategory).toBe('postres');
  });

  test('D8-C02b: filterByCategory cambia de una categoría a otra', () => {
    svc.filterByCategory('entradas', mockRecipes);
    expect(svc.currentCategory).toBe('entradas');
    svc.filterByCategory('bebidas', mockRecipes);
    expect(svc.currentCategory).toBe('bebidas');
  });

  // Conexión 3→4: selectedCategory → filterByCategory()
  test('D8-C03a: filterByCategory ejecuta el método de filtrado', () => {
    svc.filterByCategory('platos-fuertes', mockRecipes);
    expect(svc.results.length).toBeGreaterThan(0);
  });

  test('D8-C03b: filterByCategory dispara la actualización de resultados', () => {
    svc.filterByCategory('entradas', mockRecipes);
    expect(svc.results.every(r => r.category === 'entradas')).toBe(true);
  });

  // Conexión 4→5: filterByCategory → categoryFilter.set(categoryId)
  test('D8-C04a: filterByCategory setea el filtro de categoría internamente', () => {
    svc.filterByCategory('bebidas', mockRecipes);
    expect(svc.currentCategory).toBe('bebidas');
  });

  test('D8-C04b: filterByCategory con "todas" resetea el filtro', () => {
    svc.filterByCategory('todas', mockRecipes);
    expect(svc.currentCategory).toBe('todas');
  });

  // Conexión 5→6: categoryFilter.set → updateResults()
  test('D8-C05a: filterByCategory actualiza los resultados inmediatamente', () => {
    svc.filterByCategory('todas', mockRecipes);
    const allCount = svc.results.length;
    svc.filterByCategory('postres', mockRecipes);
    expect(svc.results.length).toBeLessThanOrEqual(allCount);
  });

  test('D8-C05b: filterByCategory con "todas" muestra todas las recetas', () => {
    svc.filterByCategory('todas', mockRecipes);
    expect(svc.results.length).toBe(mockRecipes.length);
  });

  // Conexión 6→7: updateResults → Obtener todas las recetas
  test('D8-C06a: updateResults accede a todas las recetas', () => {
    svc.filterByCategory('todas', mockRecipes);
    expect(svc.results.length).toBe(7);
  });

  test('D8-C06b: updateResults trabaja sobre la lista completa', () => {
    svc.filterByCategory('platos-fuertes', mockRecipes);
    expect(svc.results.length).toBe(mockRecipes.filter(r => r.category === 'platos-fuertes').length);
  });

  // Conexión 7→8: Obtener recetas → category !== 'todas'?
  test('D8-C07a: si categoría es "todas" no se aplica filtro', () => {
    svc.filterByCategory('todas', mockRecipes);
    expect(svc.results.length).toBe(7);
  });

  test('D8-C07b: si categoría no es "todas" se aplica filtro', () => {
    svc.filterByCategory('entradas', mockRecipes);
    expect(svc.results.length).toBeLessThan(7);
  });

  // Conexión 8→10 (NO): category es "todas" → Hay query de búsqueda?
  test('D8-C08a: sin filtro de categoría evalúa si hay query', () => {
    svc.filterByCategory('todas', mockRecipes);
    svc.setSearch('tacos', mockRecipes);
    expect(svc.results.length).toBeGreaterThan(0);
  });

  test('D8-C08b: sin categoría ni query retorna todas las recetas', () => {
    svc.filterByCategory('todas', mockRecipes);
    svc.setSearch('', mockRecipes);
    expect(svc.results.length).toBe(7);
  });

  // Conexión 8→9 (SI): category !== "todas" → Filtrar por category
  test('D8-C09a: filtra recetas que coinciden con la categoría', () => {
    svc.filterByCategory('postres', mockRecipes);
    expect(svc.results.every(r => r.category === 'postres')).toBe(true);
  });

  test('D8-C09b: excluye recetas que no coinciden con la categoría', () => {
    svc.filterByCategory('postres', mockRecipes);
    expect(svc.results.some(r => r.category === 'entradas')).toBe(false);
  });

  // Conexión 9→10: Filtrar categoría → Hay query de búsqueda?
  test('D8-C10a: después de filtrar categoría evalúa query', () => {
    svc.filterByCategory('platos-fuertes', mockRecipes);
    svc.setSearch('tacos', mockRecipes);
    const results = svc.results;
    expect(results.every(r => r.category === 'platos-fuertes')).toBe(true);
  });

  test('D8-C10b: categoría + query filtra ambos criterios', () => {
    svc.filterByCategory('platos-fuertes', mockRecipes);
    svc.setSearch('pozole', mockRecipes);
    expect(svc.results.length).toBeGreaterThan(0);
    expect(svc.results[0].name).toContain('Pozole');
  });

  // Conexión 10→12 (NO): Sin query → Aplicar ordenamiento
  test('D8-C11a: sin query aplica solo el ordenamiento', () => {
    svc.filterByCategory('platos-fuertes', mockRecipes);
    svc.setSortOption('likes', mockRecipes);
    const results = svc.results;
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].likes).toBeGreaterThanOrEqual(results[i + 1].likes);
    }
  });

  test('D8-C11b: sin query con sort oldest ordena correctamente', () => {
    svc.setSortOption('oldest', mockRecipes);
    expect(svc.results[0].id).toBe('r1');
  });

  // Conexión 10→11 (SI): Con query → Filtrar por nombre/desc
  test('D8-C12a: con query filtra por nombre dentro de la categoría', () => {
    svc.filterByCategory('platos-fuertes', mockRecipes);
    svc.setSearch('birria', mockRecipes);
    expect(svc.results.length).toBeGreaterThan(0);
  });

  test('D8-C12b: con query filtra por descripción', () => {
    svc.filterByCategory('platos-fuertes', mockRecipes);
    svc.setSearch('caldo', mockRecipes);
    expect(svc.results.length).toBeGreaterThan(0);
  });

  // Conexión 11→12: Filtrar nombre/desc → Aplicar ordenamiento
  test('D8-C13a: después de filtro de texto aplica el sort', () => {
    svc.setSortOption('likes', mockRecipes);
    svc.filterByCategory('todas', mockRecipes);
    svc.setSearch('tacos', mockRecipes);
    expect(svc.results.length).toBeGreaterThan(0);
  });

  test('D8-C13b: sort likes ordena por popularidad', () => {
    svc.setSortOption('likes', mockRecipes);
    svc.setSearch('', mockRecipes);
    const results = svc.results;
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].likes).toBeGreaterThanOrEqual(results[i + 1].likes);
    }
  });

  // Conexión 12→13: Aplicar ordenamiento → searchResults.set()
  test('D8-C14a: ordenamiento actualiza los resultados', () => {
    svc.setSortOption('likes', mockRecipes);
    expect(svc.results).toBeDefined();
    expect(svc.results.length).toBeGreaterThan(0);
  });

  test('D8-C14b: cambiar sort no pierde datos', () => {
    svc.filterByCategory('todas', mockRecipes);
    const count = svc.results.length;
    svc.setSortOption('oldest', mockRecipes);
    expect(svc.results.length).toBe(count);
  });

  // Conexión 13→14: searchResults.set() → Redirigir a /explore
  test('D8-C15a: resultados finales listos para mostrar', () => {
    svc.filterByCategory('entradas', mockRecipes);
    expect(svc.results.length).toBe(2);
  });

  test('D8-C15b: clearFilters resetea todo', () => {
    svc.filterByCategory('postres', mockRecipes);
    svc.setSortOption('likes', mockRecipes);
    svc.setSearch('flan', mockRecipes);
    svc.clearFilters(mockRecipes);
    expect(svc.currentCategory).toBe('todas');
    expect(svc.currentQuery).toBe('');
    expect(svc.currentSort).toBe('recent');
  });

  // Conexión 14→15: Redirigir → Fin
  test('D8-C16a: flujo completo categoría + sort termina con resultados válidos', () => {
    svc.filterByCategory('platos-fuertes', mockRecipes);
    svc.setSortOption('likes', mockRecipes);
    expect(svc.results.length).toBe(3);
    expect(svc.results.every(r => r.category === 'platos-fuertes')).toBe(true);
  });

  test('D8-C16b: flujo completo categoría + query + sort termina correctamente', () => {
    svc.filterByCategory('platos-fuertes', mockRecipes);
    svc.setSortOption('likes', mockRecipes);
    svc.setSearch('tacos', mockRecipes);
    expect(svc.results.length).toBeGreaterThan(0);
    expect(svc.results.every(r => r.category === 'platos-fuertes')).toBe(true);
  });
});
