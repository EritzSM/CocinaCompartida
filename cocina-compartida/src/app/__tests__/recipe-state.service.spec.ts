import { TestBed } from '@angular/core/testing';
import { RecipeStateService } from '../shared/services/recipe-state.service';
import { Recipe } from '../shared/interfaces/recipe';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RECIPE STATE SERVICE – Pruebas Unitarias (Patrón AAA)
//  Funcionalidad: Estado central de recetas (signals, URLs, auth)
//
//  Tipos de Mocks: Dummy (datos de prueba), Fake (localStorage)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DUMMY_RECIPE: Recipe = {
  id: 'r1', name: 'Test', descripcion: 'Desc',
  ingredients: ['a'], steps: ['b'], images: ['c'],
  category: 'Test', user: { id: 'u1', username: 'chef' },
  likes: 5, likedBy: ['u2'], comments: []
};

describe('RecipeStateService – Pruebas Unitarias', () => {
  let service: RecipeStateService;

  beforeEach(() => {
    // Test Double (Fake): localStorage simulado
    let store: Record<string, string> = {};
    spyOn(localStorage, 'getItem').and.callFake((key: string) => store[key] || null);
    spyOn(localStorage, 'setItem').and.callFake((key: string, val: string) => { store[key] = val; });

    TestBed.configureTestingModule({ providers: [RecipeStateService] });
    service = TestBed.inject(RecipeStateService);
  });

  // ──────────── URLs ────────────
  describe('URLs', () => {
    it('RS-01: recipesUrl retorna /api/recipes', () => {
      expect(service.recipesUrl).toBe('/api/recipes');
    });

    it('RS-02: getRecipeUrl construye URL con ID', () => {
      expect(service.getRecipeUrl('abc')).toBe('/api/recipes/abc');
    });

    it('RS-03: getRecipeLikeUrl construye URL de like', () => {
      expect(service.getRecipeLikeUrl('abc')).toBe('/api/recipes/abc/like');
    });

    it('RS-04: getRecipeCommentsUrl construye URL de comments', () => {
      expect(service.getRecipeCommentsUrl('abc')).toBe('/api/recipes/abc/comments');
    });

    it('RS-05: getCommentUrl construye URL de comment individual', () => {
      expect(service.getCommentUrl('c1')).toBe('/api/recipes/comments/c1');
    });
  });

  // ──────────── Signals CRUD ────────────
  describe('Signals CRUD', () => {
    it('RS-06: setRecipes y recipes() (Dummy)', () => {
      // Arrange
      const recipes = [DUMMY_RECIPE];

      // Act
      service.setRecipes(recipes);

      // Assert
      expect(service.recipes().length).toBe(1);
      expect(service.recipes()[0].id).toBe('r1');
    });

    it('RS-07: setRecipes con valor no-array establece array vacío', () => {
      // Arrange & Act
      service.setRecipes(null as any);

      // Assert
      expect(service.recipes()).toEqual([]);
    });

    it('RS-08: updateRecipes aplica función actualizadora', () => {
      // Arrange
      service.setRecipes([DUMMY_RECIPE]);

      // Act
      service.updateRecipes(list => list.map(r => ({ ...r, name: 'Updated' } as Recipe)));

      // Assert
      expect(service.recipes()[0].name).toBe('Updated');
    });

    it('RS-09: setLoading y loading()', () => {
      // Arrange & Act
      service.setLoading(true);
      expect(service.loading()).toBeTrue();

      service.setLoading(false);
      expect(service.loading()).toBeFalse();
    });

    it('RS-10: setError y error()', () => {
      // Arrange & Act
      service.setError('Test error');
      expect(service.error()).toBe('Test error');

      service.setError(null);
      expect(service.error()).toBeNull();
    });

    it('RS-11: clearError() limpia el error', () => {
      // Arrange
      service.setError('Error existente');

      // Act
      service.clearError();

      // Assert
      expect(service.error()).toBeNull();
    });

    it('RS-12: rollbackRecipes restaura estado previo', () => {
      // Arrange
      const original = [DUMMY_RECIPE];
      service.setRecipes([{ ...DUMMY_RECIPE, name: 'Modified' } as Recipe]);

      // Act
      service.rollbackRecipes(original);

      // Assert
      expect(service.recipes()[0].name).toBe('Test');
    });
  });

  // ──────────── Queries ────────────
  describe('Queries', () => {
    beforeEach(() => {
      service.setRecipes([
        DUMMY_RECIPE,
        { ...DUMMY_RECIPE, id: 'r2', user: { id: 'u2', username: 'chef2' }, likedBy: ['u1'] }
      ]);
    });

    it('RS-13: getRecipeById retorna la receta correcta', () => {
      const result = service.getRecipeById('r1');
      expect(result?.id).toBe('r1');
    });

    it('RS-14: getRecipeById retorna undefined si no existe', () => {
      const result = service.getRecipeById('nonexistent');
      expect(result).toBeUndefined();
    });

    it('RS-15: getRecipesCount retorna el conteo correcto', () => {
      expect(service.getRecipesCount()).toBe(2);
    });

    it('RS-16: getRecipesByUser filtra por userId', () => {
      const result = service.getRecipesByUser('u1');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('r1');
    });

    it('RS-17: getRecipesByUser retorna vacío si no hay recetas del usuario', () => {
      const result = service.getRecipesByUser('u99');
      expect(result.length).toBe(0);
    });

    it('RS-18: isRecipeLikedByUser retorna true si el usuario dio like', () => {
      expect(service.isRecipeLikedByUser('r2', 'u1')).toBeTrue();
    });

    it('RS-19: isRecipeLikedByUser retorna false si el usuario no dio like', () => {
      expect(service.isRecipeLikedByUser('r1', 'u99')).toBeFalse();
    });

    it('RS-20: isRecipeLikedByUser retorna false si la receta no existe', () => {
      expect(service.isRecipeLikedByUser('nonexistent', 'u1')).toBeFalse();
    });
  });

  // ──────────── Auth Headers ────────────
  describe('Auth Headers', () => {
    it('RS-21: getAuthHeaders incluye token si existe en localStorage (Fake)', () => {
      // Arrange
      (localStorage.getItem as jasmine.Spy).and.returnValue('test-token');

      // Act
      const headers = service.getAuthHeaders();

      // Assert
      expect(headers.get('Authorization')).toBe('Bearer test-token');
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('RS-22: getAuthHeaders sin token no incluye Authorization', () => {
      // Arrange
      (localStorage.getItem as jasmine.Spy).and.returnValue(null);

      // Act
      const headers = service.getAuthHeaders();

      // Assert
      expect(headers.has('Authorization')).toBeFalse();
    });

    it('RS-23: getAuthOptions retorna objeto con headers', () => {
      // Arrange & Act
      const options = service.getAuthOptions();

      // Assert
      expect(options.headers).toBeDefined();
    });
  });
});
