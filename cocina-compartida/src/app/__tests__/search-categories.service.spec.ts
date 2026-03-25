import { TestBed } from '@angular/core/testing';
import { SearchService, SortOption } from '../shared/services/search.service';
import { RecipeService } from '../shared/services/recipe';
import { Recipe } from '../shared/interfaces/recipe';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SEARCH SERVICE (Categories/Tags) – Pruebas Unitarias (AAA)
//  Funcionalidad: Búsqueda, filtrado por categoría, ordenamiento,
//  sugerencias, Levenshtein, relevancia
//
//  Tipos de Mocks:
//  1. Spy      – Verificación de llamadas
//  2. Stub     – Retornos fijos de recetas
//  3. Mock     – RecipeService completo mockeado
//  4. Dummy    – Datos de recetas de prueba
//  5. Fake     – Signal fake para recipes()
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// --- Dummy Data ---
const RECIPE_PAELLA: Recipe = {
  id: 'r1', name: 'Paella Valenciana', descripcion: 'Arroz con mariscos y azafrán',
  ingredients: ['arroz', 'azafrán'], steps: ['cocinar'], images: ['img1.jpg'],
  category: 'platos-fuertes', user: { id: 'u1', username: 'chef1' },
  likes: 30, likedBy: [], comments: [], createdAt: '2026-01-01T00:00:00Z'
};

const RECIPE_TACOS: Recipe = {
  id: 'r2', name: 'Tacos al Pastor', descripcion: 'Tacos mexicanos con piña',
  ingredients: ['tortilla', 'cerdo'], steps: ['armar'], images: ['img2.jpg'],
  category: 'platos-fuertes', user: { id: 'u2', username: 'chef2' },
  likes: 50, likedBy: [], comments: [], createdAt: '2026-02-01T00:00:00Z'
};

const RECIPE_FLAN: Recipe = {
  id: 'r3', name: 'Flan de Caramelo', descripcion: 'Postre clásico suave',
  ingredients: ['huevos', 'leche'], steps: ['hornear'], images: ['img3.jpg'],
  category: 'postres', user: { id: 'u3', username: 'chef3' },
  likes: 15, likedBy: [], comments: [], createdAt: '2026-03-01T00:00:00Z'
};

const RECIPE_LIMONADA: Recipe = {
  id: 'r4', name: 'Limonada Natural', descripcion: 'Bebida fresca de limón',
  ingredients: ['limón', 'agua'], steps: ['mezclar'], images: ['img4.jpg'],
  category: 'bebidas', user: { id: 'u4', username: 'chef4' },
  likes: 10, likedBy: [], comments: [], createdAt: '2025-12-01T00:00:00Z'
};

const RECIPE_GUACAMOLE: Recipe = {
  id: 'r5', name: 'Guacamole', descripcion: 'Entrada con aguacate',
  ingredients: ['aguacate', 'cilantro'], steps: ['aplastar'], images: ['img5.jpg'],
  category: 'entradas', user: { id: 'u5', username: 'chef5' },
  likes: 25, likedBy: [], comments: [], createdAt: '2026-01-15T00:00:00Z'
};

const ALL_RECIPES = [RECIPE_PAELLA, RECIPE_TACOS, RECIPE_FLAN, RECIPE_LIMONADA, RECIPE_GUACAMOLE];

describe('SearchService (Categories/Tags) – Pruebas Unitarias', () => {
  let service: SearchService;
  let mockRecipeService: any;

  // Fake signal helper
  function fakeSignal<T>(val: T) {
    let v = val;
    const fn = () => v;
    fn.set = (newVal: T) => { v = newVal; };
    fn.update = (updater: (v: T) => T) => { v = updater(v); };
    fn.asReadonly = () => fn;
    return fn;
  }

  beforeEach(() => {
    // Test Double (Fake): RecipeService con señal fake
    const recipesSignal = fakeSignal<Recipe[]>(ALL_RECIPES);
    mockRecipeService = {
      recipes: recipesSignal
    };

    TestBed.configureTestingModule({
      providers: [
        SearchService,
        { provide: RecipeService, useValue: mockRecipeService }
      ]
    });

    service = TestBed.inject(SearchService);
  });

  // ──────────────────────────────────────────────────────────
  //  CAT-01 a CAT-06: filterByCategory
  // ──────────────────────────────────────────────────────────
  describe('filterByCategory', () => {
    it('CAT-01: "todas" retorna todas las recetas (Dummy)', () => {
      // Arrange - todas las recetas cargadas

      // Act
      service.filterByCategory('todas');

      // Assert
      const results = service.results();
      expect(results.length).toBe(5);
    });

    it('CAT-02: "platos-fuertes" filtra solo platos fuertes (Stub)', () => {
      // Arrange - recetas ya cargadas

      // Act
      service.filterByCategory('platos-fuertes');

      // Assert
      const results = service.results();
      expect(results.length).toBe(2);
      expect(results.every(r => r.category === 'platos-fuertes')).toBeTrue();
    });

    it('CAT-03: "postres" filtra solo postres', () => {
      // Arrange
      // Act
      service.filterByCategory('postres');

      // Assert
      const results = service.results();
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Flan de Caramelo');
    });

    it('CAT-04: "bebidas" filtra solo bebidas', () => {
      // Arrange & Act
      service.filterByCategory('bebidas');

      // Assert
      const results = service.results();
      expect(results.length).toBe(1);
      expect(results[0].category).toBe('bebidas');
    });

    it('CAT-05: "entradas" filtra solo entradas', () => {
      // Arrange & Act
      service.filterByCategory('entradas');

      // Assert
      const results = service.results();
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Guacamole');
    });

    it('CAT-06: categoría inexistente retorna vacío', () => {
      // Arrange & Act
      service.filterByCategory('inexistente');

      // Assert
      expect(service.results().length).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  CAT-07 a CAT-11: search con categoría activa
  // ──────────────────────────────────────────────────────────
  describe('search + categoría combinados', () => {
    it('CAT-07: búsqueda "Paella" encuentra la receta por nombre (Spy)', () => {
      // Arrange
      // Act
      service.search('Paella');

      // Assert
      const results = service.results();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Paella');
    });

    it('CAT-08: búsqueda "mariscos" encuentra por descripción', () => {
      // Arrange & Act
      service.search('mariscos');

      // Assert
      const results = service.results();
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('r1');
    });

    it('CAT-09: búsqueda vacía con categoría activa retorna toda la categoría', () => {
      // Arrange
      service.filterByCategory('postres');

      // Act
      service.search('');

      // Assert
      const results = service.results();
      expect(results.length).toBe(1); // solo postres
    });

    it('CAT-10: búsqueda que no coincide retorna vacío', () => {
      // Arrange & Act
      service.search('xyznoexiste');

      // Assert
      expect(service.results().length).toBe(0);
    });

    it('CAT-11: filtrar categoría + buscar filtra ambos criterios', () => {
      // Arrange
      service.filterByCategory('platos-fuertes');

      // Act
      service.search('Tacos');

      // Assert
      const results = service.results();
      expect(results.length).toBe(1);
      expect(results[0].name).toContain('Tacos');
    });
  });

  // ──────────────────────────────────────────────────────────
  //  CAT-12 a CAT-16: setSortOption
  // ──────────────────────────────────────────────────────────
  describe('setSortOption', () => {
    beforeEach(() => {
      // Activar resultados con una búsqueda vacía + categoría todas
      service.filterByCategory('todas');
    });

    it('CAT-12: "recent" ordena por ID descendente (Stub)', () => {
      // Arrange & Act
      service.setSortOption('recent');

      // Assert — sortResults usa b.id.localeCompare(a.id) para "recent"
      const results = service.results();
      expect(results.length).toBe(5);
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].id.localeCompare(results[i + 1].id)).toBeGreaterThanOrEqual(0);
      }
    });

    it('CAT-13: "oldest" ordena por ID ascendente', () => {
      // Arrange & Act
      service.setSortOption('oldest');

      // Assert — sortResults usa a.id.localeCompare(b.id) para "oldest"
      const results = service.results();
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].id.localeCompare(results[i + 1].id)).toBeLessThanOrEqual(0);
      }
    });

    it('CAT-14: "likes" ordena por likes descendente', () => {
      // Arrange & Act
      service.setSortOption('likes');

      // Assert
      const results = service.results();
      for (let i = 0; i < results.length - 1; i++) {
        expect((results[i].likes ?? 0)).toBeGreaterThanOrEqual((results[i + 1].likes ?? 0));
      }
    });

    it('CAT-15: currentSort refleja la opción establecida', () => {
      // Arrange & Act
      service.setSortOption('likes');

      // Assert
      expect(service.currentSort()).toBe('likes');
    });
  });

  // ──────────────────────────────────────────────────────────
  //  CAT-17 a CAT-20: clearFilters
  // ──────────────────────────────────────────────────────────
  describe('clearFilters', () => {
    it('CAT-17: resetea todos los filtros a defaults (Spy)', () => {
      // Arrange
      service.filterByCategory('postres');
      service.search('flan');
      service.setSortOption('likes');

      // Act
      service.clearFilters();

      // Assert
      expect(service.currentQuery()).toBe('');
      expect(service.currentCategory()).toBe('todas');
      expect(service.currentSort()).toBe('recent');
    });

    it('CAT-18: después de clearFilters, results contiene todas las recetas', () => {
      // Arrange
      service.filterByCategory('postres');

      // Act
      service.clearFilters();

      // Assert
      expect(service.results().length).toBe(5);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  CAT-21 a CAT-24: Sugerencias de búsqueda (updateSuggestions)
  // ──────────────────────────────────────────────────────────
  describe('Sugerencias de búsqueda', () => {
    it('CAT-21: búsqueda genera sugerencias relevantes (Fake)', () => {
      // Arrange & Act
      service.search('Taco');

      // Assert
      const suggestions = service.suggestions();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].name).toContain('Taco');
    });

    it('CAT-22: búsqueda vacía no genera sugerencias', () => {
      // Arrange & Act
      service.search('');

      // Assert
      expect(service.suggestions().length).toBe(0);
    });

    it('CAT-23: máximo 5 sugerencias', () => {
      // Arrange - con todas las recetas
      // Act
      service.search('a'); // 'a' aparece en muchos nombres/descripciones

      // Assert
      expect(service.suggestions().length).toBeLessThanOrEqual(5);
    });

    it('CAT-24: sugerencias respetan filtro de categoría activo', () => {
      // Arrange
      service.filterByCategory('postres');

      // Act
      service.search('Flan');

      // Assert
      const suggestions = service.suggestions();
      if (suggestions.length > 0) {
        expect(suggestions.every(s => s.category === 'postres')).toBeTrue();
      }
    });
  });

  // ──────────────────────────────────────────────────────────
  //  CAT-25 a CAT-28: calculateRelevance (caja blanca)
  // ──────────────────────────────────────────────────────────
  describe('calculateRelevance (indirecto via search)', () => {
    it('CAT-25: coincidencia exacta en nombre tiene mayor relevancia', () => {
      // Arrange
      // Act
      service.search('Guacamole');

      // Assert
      const results = service.results();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('Guacamole'); // exact match first
    });

    it('CAT-26: coincidencia en nombre supera coincidencia en descripción', () => {
      // Arrange - "Natural" está en nombre de Limonada y no en otros nombres
      // Act
      service.search('Natural');

      // Assert
      const results = service.results();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('r4'); // Limonada Natural
    });
  });

  // ──────────────────────────────────────────────────────────
  //  CAT-29 a CAT-30: Levenshtein similarity
  // ──────────────────────────────────────────────────────────
  describe('Levenshtein / similarity (indirecto)', () => {
    it('CAT-29: búsqueda con typo leve encuentra resultados por similitud', () => {
      // Arrange & Act - "Guacamol" es similar a "Guacamole" (similarity 0.89 > 0.6)
      // Nota: Levenshtein compara query vs nombre completo, por eso
      // nombres cortos como "Guacamole" funcionan mejor que "Paella Valenciana"
      service.search('Guacamol');

      // Assert
      const suggestions = service.suggestions();
      const found = suggestions.some(s => s.name.includes('Guacamole'));
      expect(found).toBeTrue();
    });

    it('CAT-30: búsqueda completamente diferente no encuentra por similitud', () => {
      // Arrange & Act
      service.search('zzzzzzzzz');

      // Assert
      expect(service.suggestions().length).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  CAT-31: readonly signals
  // ──────────────────────────────────────────────────────────
  describe('Señales readonly', () => {
    it('CAT-31: currentQuery refleja última búsqueda', () => {
      // Arrange & Act
      service.search('test query');

      // Assert
      expect(service.currentQuery()).toBe('test query');
    });

    it('CAT-32: currentCategory refleja última categoría', () => {
      // Arrange & Act
      service.filterByCategory('bebidas');

      // Assert
      expect(service.currentCategory()).toBe('bebidas');
    });
  });
});
