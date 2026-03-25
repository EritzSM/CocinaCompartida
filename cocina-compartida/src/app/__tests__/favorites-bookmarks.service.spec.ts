import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { RecipeInteractionService } from '../shared/services/recipe-interaction.service';
import { RecipeStateService } from '../shared/services/recipe-state.service';
import { Auth } from '../shared/services/auth';
import { Recipe } from '../shared/interfaces/recipe';
import { of, throwError } from 'rxjs';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  FAVORITES/BOOKMARKS – Pruebas Unitarias (Patrón AAA)
//  Funcionalidad: toggleLike, isRecipeLikedByCurrentUser,
//  getCurrentUserId, interacciones de favoritos
//
//  Tipos de Mocks:
//  1. Spy      – Verificar llamadas a métodos del state
//  2. Stub     – Retornos fijos para Auth y State
//  3. Mock     – HttpClient completo mockeado
//  4. Dummy    – Datos de receta y usuario de prueba
//  5. Fake     – Callbacks de updateRecipes para verificar lógica
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// --- Dummy Data ---
const DUMMY_RECIPE: Recipe = {
  id: 'r1', name: 'Test Recipe', descripcion: 'Test',
  ingredients: ['a'], steps: ['b'], images: ['c'],
  category: 'Test', user: { id: 'u1', username: 'chef' },
  likes: 5, likedBy: ['u2', 'u3'], comments: []
};

describe('Favorites/Bookmarks (RecipeInteractionService) – Pruebas Unitarias', () => {
  let service: RecipeInteractionService;
  let mockAuth: any;
  let mockState: any;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    // Test Double (Stub): Auth
    mockAuth = {
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({ id: 'u1', username: 'testuser' })
    };

    // Test Double (Spy): RecipeStateService
    mockState = {
      recipes: jasmine.createSpy('recipes').and.returnValue([
        { ...DUMMY_RECIPE },
        { ...DUMMY_RECIPE, id: 'r2', likes: 10, likedBy: ['u1'] }
      ]),
      getRecipeLikeUrl: jasmine.createSpy('getRecipeLikeUrl').and.callFake(
        (id: string) => `/api/recipes/${id}/like`
      ),
      getRecipeCommentsUrl: jasmine.createSpy('getRecipeCommentsUrl').and.callFake(
        (id: string) => `/api/recipes/${id}/comments`
      ),
      getCommentUrl: jasmine.createSpy('getCommentUrl').and.callFake(
        (id: string) => `/api/recipes/comments/${id}`
      ),
      getAuthOptions: jasmine.createSpy('getAuthOptions').and.returnValue({ headers: {} }),
      updateRecipes: jasmine.createSpy('updateRecipes'),
      rollbackRecipes: jasmine.createSpy('rollbackRecipes'),
      setError: jasmine.createSpy('setError'),
      getRecipeById: jasmine.createSpy('getRecipeById')
    };

    // Test Double (Mock): HttpClient
    httpSpy = jasmine.createSpyObj('HttpClient', ['post', 'get', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        RecipeInteractionService,
        { provide: Auth, useValue: mockAuth },
        { provide: RecipeStateService, useValue: mockState },
        { provide: HttpClient, useValue: httpSpy }
      ]
    });

    service = TestBed.inject(RecipeInteractionService);
  });

  // ──────────────────────────────────────────────────────────
  //  FAV-01 a FAV-08: toggleLike
  // ──────────────────────────────────────────────────────────
  describe('toggleLike', () => {
    it('FAV-01: no hace nada si el usuario no está logueado (Stub null)', async () => {
      // Arrange
      mockAuth.getCurrentUser.and.returnValue(null);

      // Act
      await service.toggleLike('r1');

      // Assert
      expect(httpSpy.post).not.toHaveBeenCalled();
      expect(mockState.updateRecipes).not.toHaveBeenCalled();
    });

    it('FAV-02: no hace nada si getCurrentUser retorna user sin id', async () => {
      // Arrange
      mockAuth.getCurrentUser.and.returnValue({ username: 'no-id' });

      // Act
      await service.toggleLike('r1');

      // Assert
      expect(httpSpy.post).not.toHaveBeenCalled();
    });

    it('FAV-03: aplica optimistic update antes del HTTP (Spy)', async () => {
      // Arrange
      httpSpy.post.and.returnValue(of({ likes: 6, likedBy: ['u1', 'u2', 'u3'] }));

      // Act
      await service.toggleLike('r1');

      // Assert
      // updateRecipes debe llamarse al menos 1 vez para optimistic
      expect(mockState.updateRecipes).toHaveBeenCalled();
      expect(httpSpy.post).toHaveBeenCalledWith('/api/recipes/r1/like', {}, { headers: {} });
    });

    it('FAV-04: respuesta válida actualiza con datos del servidor (Mock)', async () => {
      // Arrange
      const serverResponse = { likes: 6, likedBy: ['u1', 'u2', 'u3'] };
      httpSpy.post.and.returnValue(of(serverResponse));

      // Act
      await service.toggleLike('r1');

      // Assert
      // Llamado 2 veces: optimistic + server update
      expect(mockState.updateRecipes).toHaveBeenCalledTimes(2);
    });

    it('FAV-05: respuesta inválida no actualiza con datos del servidor', async () => {
      // Arrange
      httpSpy.post.and.returnValue(of({ invalid: true })); // respuesta sin likes/likedBy

      // Act
      await service.toggleLike('r1');

      // Assert
      // Solo 1 vez: el optimistic update, no el server update
      expect(mockState.updateRecipes).toHaveBeenCalledTimes(1);
    });

    it('FAV-06: respuesta con likes como string no pasa validación', async () => {
      // Arrange
      httpSpy.post.and.returnValue(of({ likes: 'not-a-number', likedBy: [] }));

      // Act
      await service.toggleLike('r1');

      // Assert
      expect(mockState.updateRecipes).toHaveBeenCalledTimes(1); // solo optimistic
    });

    it('FAV-07: error HTTP hace rollback al estado anterior (Stub error)', async () => {
      // Arrange
      const previousState = [{ ...DUMMY_RECIPE }];
      mockState.recipes.and.returnValue(previousState);
      httpSpy.post.and.returnValue(throwError(() => new Error('Network error')));
      spyOn(console, 'error');

      // Act
      await service.toggleLike('r1');

      // Assert
      expect(mockState.rollbackRecipes).toHaveBeenCalledWith(previousState);
      expect(mockState.setError).toHaveBeenCalledWith('No se pudo actualizar el like');
    });

    it('FAV-08: optimistic update añade userId si no estaba en likedBy (Fake callback)', async () => {
      // Arrange
      httpSpy.post.and.returnValue(of({ likes: 6, likedBy: ['u1', 'u2', 'u3'] }));
      let optimisticUpdater: Function | null = null;
      mockState.updateRecipes.and.callFake((fn: Function) => {
        if (!optimisticUpdater) optimisticUpdater = fn;
      });

      // Act
      await service.toggleLike('r1');

      // Assert - verificar que el updater aplica correctamente
      expect(optimisticUpdater).not.toBeNull();
      const result = optimisticUpdater!([{ ...DUMMY_RECIPE }]);
      const updatedRecipe = result[0];
      // u1 no estaba en likedBy de DUMMY_RECIPE, así que debería haberse añadido
      expect(updatedRecipe.likedBy).toContain('u1');
      expect(updatedRecipe.likes).toBe(updatedRecipe.likedBy.length);
    });

    it('FAV-09: optimistic update remueve userId si ya estaba en likedBy', async () => {
      // Arrange
      const recipeWithLike = { ...DUMMY_RECIPE, likedBy: ['u1', 'u2'] };
      mockState.recipes.and.returnValue([recipeWithLike]);
      httpSpy.post.and.returnValue(of({ likes: 1, likedBy: ['u2'] }));
      let optimisticUpdater: Function | null = null;
      mockState.updateRecipes.and.callFake((fn: Function) => {
        if (!optimisticUpdater) optimisticUpdater = fn;
      });

      // Act
      await service.toggleLike('r1');

      // Assert
      expect(optimisticUpdater).not.toBeNull();
      const result = optimisticUpdater!([recipeWithLike]);
      expect(result[0].likedBy).not.toContain('u1');
    });

    it('FAV-10: no modifica recetas que no coinciden con el recipeId', async () => {
      // Arrange
      httpSpy.post.and.returnValue(of({ likes: 6, likedBy: ['u1', 'u2', 'u3'] }));
      let optimisticUpdater: Function | null = null;
      mockState.updateRecipes.and.callFake((fn: Function) => {
        if (!optimisticUpdater) optimisticUpdater = fn;
      });

      // Act
      await service.toggleLike('r1');

      // Assert
      const otherRecipe = { ...DUMMY_RECIPE, id: 'r-other', likedBy: ['u5'] };
      const result = optimisticUpdater!([{ ...DUMMY_RECIPE }, otherRecipe]);
      expect(result[1].likedBy).toEqual(['u5']); // sin cambios
    });
  });

  // ──────────────────────────────────────────────────────────
  //  FAV-11 a FAV-15: isRecipeLikedByCurrentUser
  // ──────────────────────────────────────────────────────────
  describe('isRecipeLikedByCurrentUser', () => {
    it('FAV-11: retorna true si el usuario está en likedBy (Stub)', () => {
      // Arrange
      mockAuth.getCurrentUser.and.returnValue({ id: 'u1' });
      mockState.getRecipeById.and.returnValue({ ...DUMMY_RECIPE, likedBy: ['u1', 'u2'] });

      // Act
      const result = service.isRecipeLikedByCurrentUser('r1');

      // Assert
      expect(result).toBeTrue();
    });

    it('FAV-12: retorna false si el usuario NO está en likedBy', () => {
      // Arrange
      mockAuth.getCurrentUser.and.returnValue({ id: 'u99' });
      mockState.getRecipeById.and.returnValue({ ...DUMMY_RECIPE, likedBy: ['u1'] });

      // Act
      const result = service.isRecipeLikedByCurrentUser('r1');

      // Assert
      expect(result).toBeFalse();
    });

    it('FAV-13: retorna false si no hay usuario logueado', () => {
      // Arrange
      mockAuth.getCurrentUser.and.returnValue(null);

      // Act
      const result = service.isRecipeLikedByCurrentUser('r1');

      // Assert
      expect(result).toBeFalse();
    });

    it('FAV-14: retorna false si la receta no existe', () => {
      // Arrange
      mockAuth.getCurrentUser.and.returnValue({ id: 'u1' });
      mockState.getRecipeById.and.returnValue(undefined);

      // Act
      const result = service.isRecipeLikedByCurrentUser('nonexistent');

      // Assert
      expect(result).toBeFalse();
    });

    it('FAV-15: retorna false si likedBy es undefined', () => {
      // Arrange
      mockAuth.getCurrentUser.and.returnValue({ id: 'u1' });
      mockState.getRecipeById.and.returnValue({ ...DUMMY_RECIPE, likedBy: undefined });

      // Act
      const result = service.isRecipeLikedByCurrentUser('r1');

      // Assert
      expect(result).toBeFalse();
    });
  });

  // ──────────────────────────────────────────────────────────
  //  FAV-16 a FAV-18: getCurrentUserId
  // ──────────────────────────────────────────────────────────
  describe('getCurrentUserId', () => {
    it('FAV-16: retorna el ID del usuario logueado (Stub)', () => {
      // Arrange
      mockAuth.getCurrentUser.and.returnValue({ id: 'u1' });

      // Act
      const result = service.getCurrentUserId();

      // Assert
      expect(result).toBe('u1');
    });

    it('FAV-17: retorna null si no hay usuario logueado', () => {
      // Arrange
      mockAuth.getCurrentUser.and.returnValue(null);

      // Act
      const result = service.getCurrentUserId();

      // Assert
      expect(result).toBeNull();
    });

    it('FAV-18: retorna null si getCurrentUser retorna user sin id', () => {
      // Arrange
      mockAuth.getCurrentUser.and.returnValue({ username: 'no-id' });

      // Act
      const result = service.getCurrentUserId();

      // Assert
      // undefined || null -> null due to || null in the code
      expect(result).toBeFalsy();
    });
  });

  // ──────────────────────────────────────────────────────────
  //  FAV-19 a FAV-22: canUserDeleteComment (permisos)
  // ──────────────────────────────────────────────────────────
  describe('canUserDeleteComment', () => {
    it('FAV-19: retorna true si el autor del comentario es el usuario actual (Stub)', () => {
      // Arrange
      mockAuth.getCurrentUser.and.returnValue({ id: 'u1' });

      // Act
      const result = service.canUserDeleteComment('u1');

      // Assert
      expect(result).toBeTrue();
    });

    it('FAV-20: retorna false si el autor es otro usuario', () => {
      // Arrange
      mockAuth.getCurrentUser.and.returnValue({ id: 'u1' });

      // Act
      const result = service.canUserDeleteComment('u99');

      // Assert
      expect(result).toBeFalse();
    });

    it('FAV-21: retorna false si no hay usuario logueado', () => {
      // Arrange
      mockAuth.getCurrentUser.and.returnValue(null);

      // Act
      const result = service.canUserDeleteComment('u1');

      // Assert
      expect(result).toBeFalse();
    });
  });

  // ──────────────────────────────────────────────────────────
  //  FAV-23 a FAV-26: loadComments
  // ──────────────────────────────────────────────────────────
  describe('loadComments', () => {
    it('FAV-23: GET comentarios exitoso retorna array (Mock)', async () => {
      // Arrange
      const comments = [
        { id: 'c1', message: 'Test', user: { id: 'u1', username: 'test' }, createdAt: new Date(), updatedAt: new Date() }
      ];
      httpSpy.get.and.returnValue(of(comments));

      // Act
      const result = await service.loadComments('r1');

      // Assert
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('c1');
      expect(httpSpy.get).toHaveBeenCalledWith('/api/recipes/r1/comments');
    });

    it('FAV-24: error HTTP retorna array vacío (Stub error)', async () => {
      // Arrange
      httpSpy.get.and.returnValue(throwError(() => new Error('500')));
      spyOn(console, 'error');

      // Act
      const result = await service.loadComments('r1');

      // Assert
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────
  //  FAV-27 a FAV-30: addComment
  // ──────────────────────────────────────────────────────────
  describe('addComment', () => {
    it('FAV-27: POST comentario exitoso actualiza recipes (Spy)', async () => {
      // Arrange
      const newComment = { id: 'c-new', message: 'Genial!' };
      httpSpy.post.and.returnValue(of(newComment));

      // Act
      await service.addComment('r1', { message: 'Genial!' });

      // Assert
      expect(httpSpy.post).toHaveBeenCalledWith(
        '/api/recipes/r1/comments',
        { message: 'Genial!' },
        { headers: {} }
      );
      expect(mockState.updateRecipes).toHaveBeenCalled();
    });

    it('FAV-28: error HTTP llama setError (Stub)', async () => {
      // Arrange
      httpSpy.post.and.returnValue(throwError(() => new Error('400')));
      spyOn(console, 'error');

      // Act
      await service.addComment('r1', { message: 'test' });

      // Assert
      expect(mockState.setError).toHaveBeenCalledWith('No se pudo agregar el comentario');
    });
  });

  // ──────────────────────────────────────────────────────────
  //  FAV-31 a FAV-34: deleteComment
  // ──────────────────────────────────────────────────────────
  describe('deleteComment', () => {
    it('FAV-31: DELETE exitoso remueve comentario del estado (Mock)', async () => {
      // Arrange
      httpSpy.delete.and.returnValue(of(null));

      // Act
      await service.deleteComment('c1');

      // Assert
      expect(httpSpy.delete).toHaveBeenCalledWith('/api/recipes/comments/c1', { headers: {} });
      expect(mockState.updateRecipes).toHaveBeenCalled();
    });

    it('FAV-32: error HTTP hace rollback (Stub)', async () => {
      // Arrange
      const previousState = [{ ...DUMMY_RECIPE }];
      mockState.recipes.and.returnValue(previousState);
      httpSpy.delete.and.returnValue(throwError(() => new Error('500')));
      spyOn(console, 'error');

      // Act
      await service.deleteComment('c1');

      // Assert
      expect(mockState.rollbackRecipes).toHaveBeenCalledWith(previousState);
      expect(mockState.setError).toHaveBeenCalledWith('No se pudo eliminar el comentario');
    });
  });
});
