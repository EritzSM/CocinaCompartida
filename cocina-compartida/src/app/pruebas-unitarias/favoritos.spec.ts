/**
 * ============================================================
 * PRUEBAS UNITARIAS - FUNCIONALIDAD 5: FAVORITOS (Guardados/Bookmarks)
 * ============================================================
 * Caminos independientes: 3
 * Pruebas unitarias: 3 × 2 = 6
 * Tipo: Solo Assertion (sin mocks)
 * Servicio bajo prueba: RecipeStateService
 * Lógica: Verificación de favoritos, filtrado por usuario, conteo de recetas
 * ============================================================
 */

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RecipeStateService } from '../shared/services/recipe-state.service';
import { Recipe } from '../shared/interfaces/recipe';

describe('Funcionalidad 5: Favoritos - Guardados/Bookmarks', () => {
  let stateService: RecipeStateService;
  let httpTesting: HttpTestingController;

  // Datos de prueba simulando favoritos de distintos usuarios
  const testRecipes: Recipe[] = [
    {
      id: 'fav-001', name: 'Mondongo', descripcion: 'Sopa de callos con verduras',
      ingredients: ['callos', 'papa', 'yuca'], steps: ['Cocinar callos', 'Agregar verduras'],
      images: ['mondongo.jpg'], user: { id: 'autor-1', username: 'chef_antioquia' },
      category: 'Almuerzo', likes: 14,
      likedBy: ['user-A', 'user-B', 'user-C'] // 3 usuarios dieron like/favorito
    },
    {
      id: 'fav-002', name: 'Obleas', descripcion: 'Galletas finas con arequipe y coco',
      ingredients: ['obleas', 'arequipe', 'coco'], steps: ['Rellenar obleas'],
      images: ['obleas.jpg'], user: { id: 'autor-2', username: 'chef_bogota' },
      category: 'Postre', likes: 22,
      likedBy: ['user-A', 'user-D'] // user-A también dio like a esta
    },
    {
      id: 'fav-003', name: 'Ceviche Colombiano', descripcion: 'Ceviche de camarón con limón y salsa rosada',
      ingredients: ['camarón', 'limón', 'salsa rosada'], steps: ['Preparar camarones', 'Agregar limón'],
      images: [], user: { id: 'autor-1', username: 'chef_antioquia' },
      category: 'Cena', likes: 18,
      likedBy: ['user-B', 'user-C', 'user-D'] // user-A NO dio like
    },
    {
      id: 'fav-004', name: 'Cholado', descripcion: 'Bebida fría con frutas y hielo raspado',
      ingredients: ['frutas', 'hielo', 'leche condensada'], steps: ['Raspar hielo', 'Agregar frutas'],
      images: ['cholado.jpg'], user: { id: 'autor-1', username: 'chef_antioquia' },
      category: 'Postre', likes: 0,
      likedBy: [] // Nadie ha dado like
    },
    {
      id: 'fav-005', name: 'Agua de Panela', descripcion: 'Bebida caliente de panela con limón',
      ingredients: ['panela', 'limón', 'agua'], steps: ['Hervir agua', 'Disolver panela'],
      images: [], user: { id: 'autor-3', username: 'chef_boyaca' },
      category: 'Desayuno', likes: 7,
      likedBy: ['user-A'] // Solo user-A
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

    stateService.setRecipes([...testRecipes]);
  });

  afterEach(() => {
    httpTesting.match(() => true);
  });

  // ===================================================================
  // CAMINO 1: Verificación de Favoritos por Usuario
  // Verifica si un usuario específico marcó una receta como favorita
  // ===================================================================
  describe('Camino 1: Verificación de Favoritos por Usuario', () => {

    it('C1.1 [PASA] - isRecipeLikedByUser detecta favorito existente correctamente', () => {
      // PRUEBA POSITIVA: user-A tiene favoritas fav-001, fav-002, fav-005
      expect(stateService.isRecipeLikedByUser('fav-001', 'user-A')).toBeTrue();
      expect(stateService.isRecipeLikedByUser('fav-002', 'user-A')).toBeTrue();
      expect(stateService.isRecipeLikedByUser('fav-005', 'user-A')).toBeTrue();

      // user-A NO tiene favorita fav-003
      expect(stateService.isRecipeLikedByUser('fav-003', 'user-A')).toBeFalse();
    });

    it('C1.2 [BUSCA FRAGILIDAD] - Verificar favorito en receta con likedBy vacío o inexistente', () => {
      // FRAGILIDAD: fav-004 tiene likedBy: [] (vacío)
      expect(stateService.isRecipeLikedByUser('fav-004', 'user-A')).toBeFalse();

      // Probar con receta que no existe
      expect(stateService.isRecipeLikedByUser('receta-fantasma', 'user-A')).toBeFalse();

      // Probar con userId vacío
      expect(stateService.isRecipeLikedByUser('fav-001', '')).toBeFalse();

      // FRAGILIDAD EXTRA: Insertar receta con likedBy = undefined
      const recetaSinLikedBy: Recipe = {
        id: 'fav-special', name: 'Especial', descripcion: 'test',
        ingredients: [], steps: [], images: [],
        user: { id: 'u1', username: 'test' }, category: 'Cena'
        // likes y likedBy son undefined
      };
      stateService.setRecipes([recetaSinLikedBy]);
      // undefined?.includes('user-A') → undefined || false → false
      expect(stateService.isRecipeLikedByUser('fav-special', 'user-A')).toBeFalse();
    });
  });

  // ===================================================================
  // CAMINO 2: Obtener Recetas de un Usuario Específico
  // Verifica el filtrado de recetas por ID de autor
  // ===================================================================
  describe('Camino 2: Recetas por Usuario (Perfil)', () => {

    it('C2.1 [PASA] - getRecipesByUser retorna solo las recetas del autor indicado', () => {
      // PRUEBA POSITIVA: autor-1 tiene 3 recetas (Mondongo, Ceviche, Cholado)
      const recipesAutor1 = stateService.getRecipesByUser('autor-1');
      expect(recipesAutor1.length).toBe(3);

      const names = recipesAutor1.map(r => r.name);
      expect(names).toContain('Mondongo');
      expect(names).toContain('Ceviche Colombiano');
      expect(names).toContain('Cholado');

      // autor-2 tiene 1 receta (Obleas)
      const recipesAutor2 = stateService.getRecipesByUser('autor-2');
      expect(recipesAutor2.length).toBe(1);
      expect(recipesAutor2[0].name).toBe('Obleas');

      // autor-3 tiene 1 receta (Agua de Panela)
      const recipesAutor3 = stateService.getRecipesByUser('autor-3');
      expect(recipesAutor3.length).toBe(1);
    });

    it('C2.2 [BUSCA FRAGILIDAD] - getRecipesByUser con userId inexistente retorna array vacío', () => {
      // FRAGILIDAD: No hay diferencia entre "usuario sin recetas" y "usuario inexistente"
      const recipesNoExiste = stateService.getRecipesByUser('usuario-fantasma');
      expect(recipesNoExiste.length).toBe(0);
      expect(recipesNoExiste).toEqual([]);

      // FRAGILIDAD: ¿Y si userId es null o undefined?
      const recipesNull = stateService.getRecipesByUser(null as any);
      expect(recipesNull.length).toBe(0);
      // El código hace: recipe.user?.id === null → false para todas las recetas
      // Funciona pero no lanza error de validación

      // FRAGILIDAD: ¿Y si alguna receta tiene user: null?
      stateService.setRecipes([
        {
          id: 'broken', name: 'Rota', descripcion: 'test',
          ingredients: [], steps: [], images: [],
          user: null as any, // Receta con user null
          category: 'Cena'
        }
      ]);
      // recipe.user?.id → null?.id → undefined, que !== 'autor-1'
      const resultWithNull = stateService.getRecipesByUser('autor-1');
      expect(resultWithNull.length).toBe(0); // No crashea gracias al optional chaining
    });
  });

  // ===================================================================
  // CAMINO 3: Conteo y Estado General de Recetas
  // Verifica getRecipesCount y operaciones de estado
  // ===================================================================
  describe('Camino 3: Conteo y Estado de Recetas', () => {

    it('C3.1 [PASA] - getRecipesCount retorna el número correcto de recetas', () => {
      // PRUEBA POSITIVA: deben haber 5 recetas cargadas
      expect(stateService.getRecipesCount()).toBe(5);

      // Agregar una receta al estado
      stateService.updateRecipes(list => [...list, {
        id: 'fav-006', name: 'Nueva Receta', descripcion: 'Receta adicional',
        ingredients: ['nuevo'], steps: ['Paso 1'],
        images: [], user: { id: 'autor-4', username: 'nuevo_chef' },
        category: 'Almuerzo', likes: 0, likedBy: []
      } as Recipe]);

      expect(stateService.getRecipesCount()).toBe(6);
    });

    it('C3.2 [BUSCA FRAGILIDAD] - setRecipes con valor no-array protege el estado', () => {
      // FRAGILIDAD: ¿Qué pasa si se pasa algo que no es un array?
      // El código tiene: Array.isArray(recipes) ? recipes : []

      // Pasar null
      stateService.setRecipes(null as any);
      expect(stateService.getRecipesCount()).toBe(0);
      expect(stateService.recipes()).toEqual([]);

      // Pasar undefined
      stateService.setRecipes(undefined as any);
      expect(stateService.getRecipesCount()).toBe(0);

      // Pasar un objeto (no array)
      stateService.setRecipes({ fake: true } as any);
      expect(stateService.getRecipesCount()).toBe(0);

      // Pasar string
      stateService.setRecipes('no soy array' as any);
      expect(stateService.getRecipesCount()).toBe(0);

      // Restaurar y verificar que funciona normalmente después
      stateService.setRecipes(testRecipes);
      expect(stateService.getRecipesCount()).toBe(5);
      // El guard Array.isArray protege bien, pero no hay logging de estos inputs inválidos
    });
  });
});
