/**
 * ============================================================
 * PRUEBAS UNITARIAS - FUNCIONALIDAD 2: DETALLE DE RECETA
 * ============================================================
 * Caminos independientes: 4
 * Pruebas unitarias: 4 × 2 = 8
 * Tipo: Solo Assertion (sin mocks)
 * Servicios bajo prueba: RecipeStateService, RecipeInteractionService
 * Lógica: Validación de likes, permisos de comentarios, búsqueda por ID
 * ============================================================
 */

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RecipeStateService } from '../shared/services/recipe-state.service';
import { RecipeInteractionService } from '../shared/services/recipe-interaction.service';
import { Recipe } from '../shared/interfaces/recipe';

describe('Funcionalidad 2: Detalle de Receta', () => {
  let stateService: RecipeStateService;
  let interactionService: RecipeInteractionService;
  let httpTesting: HttpTestingController;

  // Datos de prueba
  const testRecipes: Recipe[] = [
    {
      id: 'rec-001', name: 'Ajiaco Bogotano', descripcion: 'Sopa espesa con tres tipos de papa',
      ingredients: ['papa criolla', 'papa sabanera', 'papa pastusa', 'pollo', 'guascas'],
      steps: ['Hervir papas', 'Agregar pollo', 'Condimentar con guascas'],
      images: ['img1.jpg', 'img2.jpg'],
      user: { id: 'user-100', username: 'chef_bogota' },
      category: 'Almuerzo', likes: 12, likedBy: ['user-200', 'user-300'],
      createdAt: '2025-03-01T10:00:00Z'
    },
    {
      id: 'rec-002', name: 'Pandebono', descripcion: 'Pan de queso del Valle del Cauca',
      ingredients: ['almidón de yuca', 'queso costeño', 'huevo'],
      steps: ['Mezclar ingredientes', 'Formar bolitas', 'Hornear'],
      images: ['img3.jpg'],
      user: { id: 'user-200', username: 'chef_cali' },
      category: 'Desayuno', likes: 7, likedBy: ['user-100'],
      createdAt: '2025-02-15T08:00:00Z'
    },
    {
      id: 'rec-003', name: 'Lechona Tolimense', descripcion: 'Cerdo relleno de arroz y arvejas',
      ingredients: ['cerdo', 'arroz', 'arvejas'],
      steps: ['Preparar relleno', 'Rellenar cerdo', 'Hornear 12 horas'],
      images: [],
      user: { id: 'user-300', username: 'chef_tolima' },
      category: 'Cena', likes: 0, likedBy: [],
      createdAt: '2025-01-20T18:00:00Z'
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
    interactionService = TestBed.inject(RecipeInteractionService);

    // Cargar datos de prueba
    stateService.setRecipes([...testRecipes]);
  });

  afterEach(() => {
    httpTesting.match(() => true);
  });

  // ===================================================================
  // CAMINO 1: Validación de Respuesta de Like (isValidLikeResponse)
  // Verifica el type guard que valida la estructura de la respuesta del servidor
  // ===================================================================
  describe('Camino 1: Validación de Respuesta de Like', () => {

    it('C1.1 [PASA] - Respuesta válida con likes numérico y likedBy array retorna true', () => {
      // PRUEBA POSITIVA: estructura correcta del servidor
      const validResponse = { likes: 5, likedBy: ['user-1', 'user-2'] };
      const result = (interactionService as any).isValidLikeResponse(validResponse);
      expect(result).toBeTrue();
    });

    it('C1.2 [BUSCA FRAGILIDAD] - Respuesta con likes=NaN pasa la validación typeof', () => {
      // FRAGILIDAD REAL: typeof NaN === 'number' retorna true en JavaScript
      // El type guard solo verifica typeof response.likes === 'number'
      // NaN es técnicamente un "number" pero NO es un valor válido de likes
      const nanResponse = { likes: NaN, likedBy: ['user-1'] };
      const result = (interactionService as any).isValidLikeResponse(nanResponse);
      // Este test expone que NaN pasa la validación, lo cual es una fragilidad
      expect(result).toBeTrue(); // NaN PASA la validación - esto es una fragilidad
    });
  });

  // ===================================================================
  // CAMINO 2: Búsqueda de Receta por ID
  // Verifica la búsqueda en el estado local de recetas
  // ===================================================================
  describe('Camino 2: Búsqueda de Receta por ID', () => {

    it('C2.1 [PASA] - Encontrar receta existente por ID retorna la receta correcta', () => {
      // PRUEBA POSITIVA: ID existente retorna la receta
      const recipe = stateService.getRecipeById('rec-001');
      expect(recipe).toBeDefined();
      expect(recipe!.name).toBe('Ajiaco Bogotano');
      expect(recipe!.user.username).toBe('chef_bogota');
    });

    it('C2.2 [BUSCA FRAGILIDAD] - Buscar con ID inexistente retorna undefined, no null', () => {
      // FRAGILIDAD: getRecipeById usa Array.find() que retorna undefined (no null)
      // Si algún componente compara con === null en vez de verificar truthy/falsy,
      // tendrá un bug silencioso
      const recipe = stateService.getRecipeById('id-inexistente-xyz');
      expect(recipe).toBeUndefined(); // NO es null, es undefined
      // Un componente que haga: if (recipe === null) { showError() } NO mostraría el error
    });
  });

  // ===================================================================
  // CAMINO 3: Verificación de Like del Usuario Actual
  // Verifica si el usuario actual ha dado like a una receta específica
  // ===================================================================
  describe('Camino 3: Verificación de Like del Usuario', () => {

    it('C3.1 [PASA] - isRecipeLikedByUser detecta correctamente un like existente', () => {
      // PRUEBA POSITIVA: user-200 está en likedBy de rec-001
      const isLiked = stateService.isRecipeLikedByUser('rec-001', 'user-200');
      expect(isLiked).toBeTrue();
    });

    it('C3.2 [BUSCA FRAGILIDAD] - isRecipeLikedByUser con likedBy vacío retorna false correctamente', () => {
      // FRAGILIDAD: rec-003 tiene likedBy: [] (array vacío)
      // La cadena: recipe?.likedBy?.includes(userId) || false
      // Con likedBy vacío: [].includes('user-100') → false || false → false
      const isLiked = stateService.isRecipeLikedByUser('rec-003', 'user-100');
      expect(isLiked).toBeFalse();

      // Probar también con undefined likedBy
      const recipeWithUndefinedLikes: Recipe = {
        id: 'rec-special', name: 'Test', descripcion: 'test',
        ingredients: [], steps: [], images: [],
        user: { id: 'u1', username: 'test' }, category: 'Cena',
        likes: undefined, likedBy: undefined
      };
      stateService.setRecipes([recipeWithUndefinedLikes]);
      const isLikedUndefined = stateService.isRecipeLikedByUser('rec-special', 'user-100');
      expect(isLikedUndefined).toBeFalse(); // undefined?.includes() → undefined || false → false
    });
  });

  // ===================================================================
  // CAMINO 4: Construcción de URLs de API
  // Verifica que las URLs se construyen correctamente para cada endpoint
  // ===================================================================
  describe('Camino 4: Construcción de URLs de API', () => {

    it('C4.1 [PASA] - URLs de receta, like y comentarios se construyen correctamente', () => {
      // PRUEBA POSITIVA: verificar formato de URLs
      const recipeUrl = stateService.getRecipeUrl('rec-001');
      expect(recipeUrl).toBe('/api/recipes/rec-001');

      const likeUrl = stateService.getRecipeLikeUrl('rec-001');
      expect(likeUrl).toBe('/api/recipes/rec-001/like');

      const commentsUrl = stateService.getRecipeCommentsUrl('rec-001');
      expect(commentsUrl).toBe('/api/recipes/rec-001/comments');

      const commentUrl = stateService.getCommentUrl('comment-1');
      expect(commentUrl).toBe('/api/recipes/comments/comment-1');
    });

    it('C4.2 [BUSCA FRAGILIDAD] - URLs con ID vacío o caracteres especiales', () => {
      // FRAGILIDAD: ¿Qué pasa si el recipeId tiene caracteres especiales o está vacío?
      // No hay validación de input en las funciones de URL

      // ID vacío genera URL inválida con doble slash
      const urlEmpty = stateService.getRecipeUrl('');
      expect(urlEmpty).toBe('/api/recipes/'); // Doble slash podría causar 404

      // ID con caracteres especiales no se encodea
      const urlSpecial = stateService.getRecipeUrl('id con espacios');
      expect(urlSpecial).toBe('/api/recipes/id con espacios'); // No URL-encoded

      // ID con slash podría alterar la estructura de la URL
      const urlSlash = stateService.getRecipeUrl('abc/def');
      expect(urlSlash).toBe('/api/recipes/abc/def'); // Ruta alterada
      // FRAGILIDAD: estos IDs no son validados ni sanitizados
    });
  });
});
