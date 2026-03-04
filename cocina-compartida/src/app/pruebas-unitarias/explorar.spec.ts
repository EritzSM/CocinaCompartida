/**
 * ============================================================
 * PRUEBAS UNITARIAS - FUNCIONALIDAD 1: EXPLORAR (Motor de Búsqueda)
 * ============================================================
 * Caminos independientes: 5
 * Pruebas unitarias: 5 × 2 = 10
 * Tipo: Solo Assertion (sin mocks)
 * Servicio bajo prueba: SearchService (search.service.ts)
 * Algoritmos: Levenshtein, Similitud, Relevancia, Ordenamiento, Filtrado
 * ============================================================
 */

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { SearchService } from '../shared/services/search.service';
import { RecipeStateService } from '../shared/services/recipe-state.service';
import { Recipe } from '../shared/interfaces/recipe';

describe('Funcionalidad 1: Explorar - Motor de Búsqueda', () => {
  let searchService: SearchService;
  let stateService: RecipeStateService;
  let httpTesting: HttpTestingController;

  // Datos de prueba: recetas realistas
  const testRecipes: Recipe[] = [
    {
      id: '1', name: 'Arroz con Pollo', descripcion: 'Delicioso arroz colombiano con pollo desmenuzado',
      ingredients: ['arroz', 'pollo', 'sal', 'cebolla'], steps: ['Cocinar arroz', 'Desmenuzar pollo'],
      images: [], user: { id: 'u1', username: 'chef_maria' }, category: 'Almuerzo',
      likes: 10, likedBy: ['u2', 'u3'], createdAt: '2025-01-15T10:00:00Z'
    },
    {
      id: '2', name: 'Bandeja Paisa', descripcion: 'Plato típico antioqueño con frijoles y chicharrón',
      ingredients: ['frijoles', 'chicharrón', 'arroz'], steps: ['Preparar frijoles', 'Freír chicharrón'],
      images: [], user: { id: 'u2', username: 'chef_carlos' }, category: 'Cena',
      likes: 25, likedBy: ['u1', 'u3', 'u4'], createdAt: '2025-02-20T14:00:00Z'
    },
    {
      id: '3', name: 'Arepas de Choclo', descripcion: 'Arepas dulces de maíz tierno',
      ingredients: ['maíz', 'queso', 'mantequilla'], steps: ['Moler maíz', 'Asar arepas'],
      images: [], user: { id: 'u1', username: 'chef_maria' }, category: 'Desayuno',
      likes: 15, likedBy: ['u2', 'u4'], createdAt: '2025-03-01T08:00:00Z'
    },
    {
      id: '4', name: 'Sancocho de Gallina', descripcion: 'Sopa tradicional colombiana con gallina y verduras',
      ingredients: ['gallina', 'yuca', 'plátano', 'papa'], steps: ['Hervir gallina', 'Agregar verduras'],
      images: [], user: { id: 'u3', username: 'chef_lucia' }, category: 'Almuerzo',
      likes: 8, likedBy: ['u1'], createdAt: '2025-01-10T12:00:00Z'
    },
    {
      id: '5', name: 'Empanadas', descripcion: 'Empanadas colombianas rellenas de carne y papa',
      ingredients: ['masa', 'carne', 'papa'], steps: ['Preparar masa', 'Rellenar', 'Freír'],
      images: [], user: { id: 'u2', username: 'chef_carlos' }, category: 'Cena',
      likes: 20, likedBy: ['u1', 'u3'], createdAt: '2025-02-15T16:00:00Z'
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

    // Cargar datos de prueba en el estado
    stateService.setRecipes([...testRecipes]);
  });

  afterEach(() => {
    // Limpiar peticiones HTTP pendientes (del constructor de RecipeService)
    httpTesting.match(() => true);
  });

  // ===================================================================
  // CAMINO 1: Algoritmo de Distancia Levenshtein
  // Verifica el cálculo de distancia de edición entre strings
  // ===================================================================
  describe('Camino 1: Algoritmo Levenshtein', () => {

    it('C1.1 [PASA] - La distancia entre strings idénticos debe ser 0', () => {
      // PRUEBA POSITIVA: strings iguales → distancia = 0
      const distance = (searchService as any).levenshteinDistance('arroz', 'arroz');
      expect(distance).toBe(0);
    });

    it('C1.2 [BUSCA FRAGILIDAD] - Distancia con string vacío debe ser la longitud del otro string', () => {
      // FRAGILIDAD: ¿El algoritmo maneja correctamente strings vacíos?
      // Si str1 = '' y str2 = 'hola', la distancia debería ser 4 (4 inserciones)
      const distance = (searchService as any).levenshteinDistance('', 'hola');
      expect(distance).toBe(4);
    });
  });

  // ===================================================================
  // CAMINO 2: Cálculo de Similitud (basado en Levenshtein)
  // Verifica la normalización de distancia a porcentaje de similitud
  // ===================================================================
  describe('Camino 2: Cálculo de Similitud', () => {

    it('C2.1 [PASA] - Strings idénticos tienen similitud perfecta (1.0)', () => {
      // PRUEBA POSITIVA: 'pollo' vs 'pollo' → similitud = 1.0
      const similarity = (searchService as any).calculateSimilarity('pollo', 'pollo');
      expect(similarity).toBe(1.0);
    });

    it('C2.2 [BUSCA FRAGILIDAD] - Ambos strings vacíos: ¿retorna 1.0 o causa error?', () => {
      // FRAGILIDAD: Cuando longer.length === 0, el código retorna 1.0
      // ¿Es correcto decir que dos strings vacíos son 100% similares?
      // Esto podría causar falsos positivos en la búsqueda
      const similarity = (searchService as any).calculateSimilarity('', '');
      expect(similarity).toBe(1.0);
      // NOTA: Este test PASA pero expone un comportamiento cuestionable:
      // dos strings vacíos se consideran 100% similares, lo que podría
      // hacer que recetas sin nombre aparezcan como sugerencias
    });
  });

  // ===================================================================
  // CAMINO 3: Cálculo de Relevancia (puntuación de búsqueda)
  // Verifica la asignación de pesos por tipo de coincidencia
  // ===================================================================
  describe('Camino 3: Cálculo de Relevancia', () => {

    it('C3.1 [PASA] - Coincidencia exacta en nombre tiene la mayor relevancia', () => {
      // PRUEBA POSITIVA: buscar 'empanadas' debe dar alta relevancia a la receta 'Empanadas'
      const recipe = testRecipes[4]; // 'Empanadas'
      const relevance = (searchService as any).calculateRelevance(recipe, 'empanadas');
      // Coincidencia exacta (10) + startsWith (8) + includes (5) + word match (4) = 27
      expect(relevance).toBeGreaterThan(20);
    });

    it('C3.2 [BUSCA FRAGILIDAD] - Query vacío debe retornar relevancia 0, no lanzar error', () => {
      // FRAGILIDAD: Si query = '', split(' ') produce [''], filter(length > 0) da []
      // searchTerms.length === 0 → retorna 0. ¿Funciona correctamente?
      const recipe = testRecipes[0];
      const relevance = (searchService as any).calculateRelevance(recipe, '');
      expect(relevance).toBe(0);
    });
  });

  // ===================================================================
  // CAMINO 4: Ordenamiento de Resultados
  // Verifica los 3 criterios de ordenamiento: reciente, antiguo, likes
  // ===================================================================
  describe('Camino 4: Ordenamiento de Resultados', () => {

    it('C4.1 [PASA] - Ordenar por likes coloca la receta con más likes primero', () => {
      // PRUEBA POSITIVA: Al ordenar por likes, Bandeja Paisa (25) debe ser primera
      searchService.setSortOption('likes');
      // Llamar search sin query para obtener todas las recetas ordenadas
      searchService.search('');
      const results = searchService.results();
      if (results.length >= 2) {
        expect(results[0].likes).toBeGreaterThanOrEqual(results[1].likes!);
      }
      // Verificar que Bandeja Paisa (25 likes) está primera
      expect(results[0].name).toBe('Bandeja Paisa');
    });

    it('C4.2 [BUSCA FRAGILIDAD] - Ordenar por "recent" usa localeCompare en IDs, no fechas reales', () => {
      // FRAGILIDAD REAL: sortResults para 'recent' usa b.id.localeCompare(a.id)
      // Esto asume que IDs más altos = más recientes, lo cual NO es correcto con UUIDs
      // Si los IDs fueran UUIDs, el orden sería impredecible
      searchService.setSortOption('recent');
      searchService.search('');
      const results = searchService.results();
      // Con IDs numéricos ('1','2','3','4','5'), localeCompare ordena '5' > '4' > '3'...
      // Esto coincide con el orden esperado SOLO porque los IDs son secuenciales
      expect(results[0].id).toBe('5'); // ID '5' > '4' por localeCompare
      expect(results[results.length - 1].id).toBe('1');
      // NOTA: Si los IDs fueran UUIDs, este ordenamiento NO daría resultados cronológicos
    });
  });

  // ===================================================================
  // CAMINO 5: Búsqueda y Filtrado General
  // Verifica el flujo completo de búsqueda con texto
  // ===================================================================
  describe('Camino 5: Búsqueda y Filtrado', () => {

    it('C5.1 [PASA] - Búsqueda por nombre filtra correctamente', () => {
      // PRUEBA POSITIVA: buscar 'arroz' debe encontrar 'Arroz con Pollo'
      searchService.search('arroz');
      const results = searchService.results();
      expect(results.length).toBeGreaterThan(0);
      // Al menos una receta debe contener 'arroz' en nombre o descripción
      const containsArroz = results.some((r: Recipe) =>
        r.name.toLowerCase().includes('arroz') ||
        r.descripcion.toLowerCase().includes('arroz')
      );
      expect(containsArroz).toBeTrue();
    });

    it('C5.2 [BUSCA FRAGILIDAD] - Búsqueda con caracteres especiales de regex no debe causar error', () => {
      // FRAGILIDAD: Si el código usara regex internamente, estos caracteres causarían
      // un error de sintaxis regex. El código actual usa .includes() que es seguro,
      // pero futuras refactorizaciones podrían introducir regex sin escapar
      expect(() => {
        searchService.search('.*+?^${}()|[]\\');
      }).not.toThrow();

      // También verificar que no retorna resultados erróneos
      const results = searchService.results();
      expect(results.length).toBe(0); // No debería coincidir con nada
    });
  });
});
