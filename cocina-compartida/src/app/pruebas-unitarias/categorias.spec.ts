/**
 * ============================================================
 * PRUEBAS UNITARIAS - FUNCIONALIDAD 4: CATEGORÍAS (Sistema de Etiquetas)
 * ============================================================
 * Caminos independientes: 4
 * Pruebas unitarias: 4 × 2 = 8
 * Tipo: Solo Assertion (sin mocks)
 * Servicios bajo prueba: SearchService (search.service.ts)
 * Lógica: Filtrado por categoría, combinación búsqueda+categoría, limpieza de filtros
 * ============================================================
 */

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { SearchService } from '../shared/services/search.service';
import { RecipeStateService } from '../shared/services/recipe-state.service';
import { Recipe } from '../shared/interfaces/recipe';

describe('Funcionalidad 4: Categorías - Sistema de Etiquetas', () => {
  let searchService: SearchService;
  let stateService: RecipeStateService;
  let httpTesting: HttpTestingController;

  // Datos de prueba con diversas categorías
  const testRecipes: Recipe[] = [
    {
      id: 'cat-001', name: 'Calentado', descripcion: 'Arroz y frijoles recalentados para el desayuno',
      ingredients: ['arroz', 'frijoles'], steps: ['Recalentar'],
      images: [], user: { id: 'u1', username: 'chef1' },
      category: 'Desayuno', likes: 5, likedBy: ['u2']
    },
    {
      id: 'cat-002', name: 'Huevos Pericos', descripcion: 'Huevos revueltos con tomate y cebolla',
      ingredients: ['huevos', 'tomate', 'cebolla'], steps: ['Revolver huevos'],
      images: [], user: { id: 'u1', username: 'chef1' },
      category: 'Desayuno', likes: 8, likedBy: ['u2', 'u3']
    },
    {
      id: 'cat-003', name: 'Cazuela de Mariscos', descripcion: 'Sopa cremosa de mariscos estilo Cartagena',
      ingredients: ['camarones', 'leche de coco', 'pescado'], steps: ['Cocinar mariscos'],
      images: [], user: { id: 'u2', username: 'chef2' },
      category: 'Almuerzo', likes: 15, likedBy: ['u1', 'u3', 'u4']
    },
    {
      id: 'cat-004', name: 'Arroz con Coco', descripcion: 'Arroz dulce con leche de coco',
      ingredients: ['arroz', 'coco'], steps: ['Cocinar con leche de coco'],
      images: [], user: { id: 'u3', username: 'chef3' },
      category: 'Almuerzo', likes: 10, likedBy: ['u1', 'u2']
    },
    {
      id: 'cat-005', name: 'Patacones', descripcion: 'Plátano verde frito y aplastado',
      ingredients: ['plátano verde', 'aceite'], steps: ['Freír', 'Aplastar', 'Freír de nuevo'],
      images: [], user: { id: 'u2', username: 'chef2' },
      category: 'Cena', likes: 12, likedBy: ['u1']
    },
    {
      id: 'cat-006', name: 'Buñuelos', descripcion: 'Bolitas de queso fritas, postre tradicional',
      ingredients: ['queso', 'almidón', 'huevo'], steps: ['Mezclar', 'Freír'],
      images: [], user: { id: 'u3', username: 'chef3' },
      category: 'Postre', likes: 20, likedBy: ['u1', 'u2', 'u3']
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    httpTesting = TestBed.inject(HttpTestingController);
    stateService = TestBed.inject(RecipeStateService);
    searchService = TestBed.inject(SearchService);

    stateService.setRecipes([...testRecipes]);
  });

  afterEach(() => {
    httpTesting.match(() => true);
  });

  // ===================================================================
  // CAMINO 1: Filtrado por Categoría Específica
  // Verifica que filterByCategory filtra correctamente las recetas
  // ===================================================================
  describe('Camino 1: Filtrado por Categoría Específica', () => {

    it('C1.1 [PASA] - Filtrar por "Desayuno" retorna solo recetas de desayuno', () => {
      // PRUEBA POSITIVA: solo las recetas con category='Desayuno' deben aparecer
      searchService.filterByCategory('Desayuno');
      searchService.search(''); // Ejecutar búsqueda vacía para obtener resultados filtrados
      const results = searchService.results();

      expect(results.length).toBe(2);
      results.forEach((recipe: Recipe) => {
        expect(recipe.category).toBe('Desayuno');
      });
      // Verificar que son las recetas correctas
      const names = results.map((r: Recipe) => r.name);
      expect(names).toContain('Calentado');
      expect(names).toContain('Huevos Pericos');
    });

    it('C1.2 [BUSCA FRAGILIDAD] - Filtrar por categoría inexistente retorna array vacío', () => {
      // FRAGILIDAD: No hay validación de categorías válidas
      // Cualquier string se acepta como categoría, incluso una que no existe
      searchService.filterByCategory('CategoríaInventada');
      searchService.search('');
      const results = searchService.results();

      expect(results.length).toBe(0); // Sin resultados, sin error, sin feedback al usuario
      // FRAGILIDAD: El usuario no recibe ninguna indicación de que la categoría no existe
    });
  });

  // ===================================================================
  // CAMINO 2: Filtro "Todas" las Categorías
  // Verifica que el filtro 'todas' muestra todas las recetas
  // ===================================================================
  describe('Camino 2: Mostrar Todas las Categorías', () => {

    it('C2.1 [PASA] - Filtro "todas" muestra todas las recetas sin filtrar', () => {
      // PRUEBA POSITIVA: 'todas' es el filtro por defecto, muestra todo
      searchService.filterByCategory('todas');
      searchService.search('');
      const results = searchService.results();

      expect(results.length).toBe(6); // Todas las recetas
    });

    it('C2.2 [BUSCA FRAGILIDAD] - Sensibilidad a mayúsculas en el filtro "todas"', () => {
      // FRAGILIDAD: El código compara category !== 'todas' (minúsculas)
      // Si alguien pasa 'Todas' o 'TODAS', el filtro NO se desactiva
      searchService.filterByCategory('Todas'); // Con T mayúscula
      searchService.search('');
      const results = searchService.results();

      // 'Todas' !== 'todas' → se aplica como filtro de categoría
      // Pero ninguna receta tiene category='Todas', así que retorna 0
      expect(results.length).toBe(0);
      // FRAGILIDAD: La comparación es case-sensitive para el filtro especial 'todas'
    });
  });

  // ===================================================================
  // CAMINO 3: Combinación Búsqueda + Categoría
  // Verifica que búsqueda y categoría se aplican simultáneamente
  // ===================================================================
  describe('Camino 3: Búsqueda Combinada con Categoría', () => {

    it('C3.1 [PASA] - Buscar "arroz" en categoría "Almuerzo" filtra correctamente', () => {
      // PRUEBA POSITIVA: combinar búsqueda textual + filtro de categoría
      searchService.filterByCategory('Almuerzo');
      searchService.search('arroz');
      const results = searchService.results();

      // Solo 'Arroz con Coco' está en Almuerzo Y contiene 'arroz'
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Arroz con Coco');
    });

    it('C3.2 [BUSCA FRAGILIDAD] - Buscar con categoría activa no encuentra en otras categorías', () => {
      // FRAGILIDAD: Si el usuario busca algo que existe en otra categoría,
      // no obtiene resultados pero no recibe sugerencia de cambiar categoría
      searchService.filterByCategory('Postre');
      searchService.search('mariscos'); // Existe en Almuerzo, no en Postre
      const results = searchService.results();

      expect(results.length).toBe(0);
      // FRAGILIDAD: El usuario podría creer que 'mariscos' no existe en la app
      // cuando en realidad está en otra categoría
    });
  });

  // ===================================================================
  // CAMINO 4: Limpieza de Filtros (clearFilters)
  // Verifica que clearFilters restablece todos los estados
  // ===================================================================
  describe('Camino 4: Limpieza de Filtros', () => {

    it('C4.1 [PASA] - clearFilters restablece categoría, query y sort a valores por defecto', () => {
      // PRUEBA POSITIVA: después de aplicar filtros, clearFilters los limpia
      searchService.filterByCategory('Desayuno');
      searchService.search('huevos');
      searchService.setSortOption('likes');

      // Verificar que los filtros están activos
      expect(searchService.currentCategory()).toBe('Desayuno');
      expect(searchService.currentQuery()).toBe('huevos');
      expect(searchService.currentSort()).toBe('likes');

      // Limpiar
      searchService.clearFilters();

      expect(searchService.currentCategory()).toBe('todas');
      expect(searchService.currentQuery()).toBe('');
      expect(searchService.currentSort()).toBe('recent');
    });

    it('C4.2 [BUSCA FRAGILIDAD] - clearFilters llamado múltiples veces no causa side effects', () => {
      // FRAGILIDAD: ¿Llamar clearFilters repetidamente causa problemas?
      searchService.filterByCategory('Cena');
      searchService.search('patacones');

      // Limpiar múltiples veces
      searchService.clearFilters();
      searchService.clearFilters();
      searchService.clearFilters();

      // Los valores deben seguir en los defaults
      expect(searchService.currentCategory()).toBe('todas');
      expect(searchService.currentQuery()).toBe('');
      expect(searchService.currentSort()).toBe('recent');

      // Los resultados deben incluir todas las recetas
      const results = searchService.results();
      expect(results.length).toBe(6);
    });
  });
});
