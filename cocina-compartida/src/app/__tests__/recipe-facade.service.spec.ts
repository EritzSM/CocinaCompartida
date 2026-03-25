import { TestBed } from '@angular/core/testing';
import { RecipeService } from '../shared/services/recipe';
import { RecipeCrudService } from '../shared/services/recipe-crud.service';
import { RecipeInteractionService } from '../shared/services/recipe-interaction.service';
import { RecipeStateService } from '../shared/services/recipe-state.service';
import { Recipe } from '../shared/interfaces/recipe';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RECIPE SERVICE (Facade) – Pruebas Unitarias (Patrón AAA)
//  Funcionalidad: Fachada que delega a CRUD, Interaction, State
//
//  Tipos de Mocks: Spy, Stub, Dummy, Fake
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DUMMY_RECIPE: Recipe = {
  id: 'r1', name: 'Test', descripcion: 'Desc',
  ingredients: ['a'], steps: ['b'], images: ['c'],
  category: 'Test', user: { id: 'u1', username: 'chef' },
  likes: 5, likedBy: [], comments: []
};

describe('RecipeService (Facade) – Pruebas Unitarias', () => {
  let service: RecipeService;
  let mockCrud: any;
  let mockInteraction: any;
  let mockState: any;

  // Fake signal
  function fakeComputed<T>(val: T) {
    return () => val;
  }

  beforeEach(() => {
    // Test Double (Spy): Servicios delegados
    mockCrud = {
      loadRecipes: jasmine.createSpy('loadRecipes').and.returnValue(Promise.resolve()),
      loadTopLikedRecipes: jasmine.createSpy('loadTopLikedRecipes').and.returnValue(Promise.resolve([])),
      getRecipeById: jasmine.createSpy('getRecipeById').and.returnValue(Promise.resolve(DUMMY_RECIPE)),
      createRecipe: jasmine.createSpy('createRecipe').and.returnValue(Promise.resolve(DUMMY_RECIPE)),
      updateRecipe: jasmine.createSpy('updateRecipe').and.returnValue(Promise.resolve(DUMMY_RECIPE)),
      deleteRecipe: jasmine.createSpy('deleteRecipe').and.returnValue(Promise.resolve(true)),
      downloadPDF: jasmine.createSpy('downloadPDF').and.returnValue(Promise.resolve()),
      downloadImage: jasmine.createSpy('downloadImage').and.returnValue(Promise.resolve())
    };

    mockInteraction = {
      toggleLike: jasmine.createSpy('toggleLike').and.returnValue(Promise.resolve()),
      addComment: jasmine.createSpy('addComment').and.returnValue(Promise.resolve()),
      loadComments: jasmine.createSpy('loadComments').and.returnValue(Promise.resolve([])),
      deleteComment: jasmine.createSpy('deleteComment').and.returnValue(Promise.resolve()),
      canUserDeleteComment: jasmine.createSpy('canUserDeleteComment').and.returnValue(true),
      isRecipeLikedByCurrentUser: jasmine.createSpy('isRecipeLikedByCurrentUser').and.returnValue(false),
      getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue('u1')
    };

    // Test Double (Fake): State con signals fake
    mockState = {
      recipes: fakeComputed([DUMMY_RECIPE]),
      loading: fakeComputed(false),
      error: fakeComputed(null),
      updateRecipes: jasmine.createSpy('updateRecipes')
    };

    TestBed.configureTestingModule({
      providers: [
        RecipeService,
        { provide: RecipeCrudService, useValue: mockCrud },
        { provide: RecipeInteractionService, useValue: mockInteraction },
        { provide: RecipeStateService, useValue: mockState }
      ]
    });

    service = TestBed.inject(RecipeService);
  });

  // ──────────── Delegación CRUD ────────────
  describe('Delegación CRUD', () => {
    it('RF-01: loadRecipes delega a crudService', async () => {
      await service.loadRecipes();
      expect(mockCrud.loadRecipes).toHaveBeenCalled();
    });

    it('RF-02: loadTopLikedRecipes delega a crudService', async () => {
      await service.loadTopLikedRecipes();
      expect(mockCrud.loadTopLikedRecipes).toHaveBeenCalled();
    });

    it('RF-03: getRecipeById delega a crudService', async () => {
      const result = await service.getRecipeById('r1');
      expect(mockCrud.getRecipeById).toHaveBeenCalledWith('r1');
      expect(result).toEqual(DUMMY_RECIPE);
    });

    it('RF-04: addRecipe delega a crudService.createRecipe', async () => {
      const input = { name: 'New', descripcion: 'D', ingredients: [], steps: [], images: [], category: 'X' } as any;
      await service.addRecipe(input);
      expect(mockCrud.createRecipe).toHaveBeenCalledWith(input);
    });

    it('RF-05: updateRecipe delega a crudService', async () => {
      await service.updateRecipe('r1', { name: 'Updated' });
      expect(mockCrud.updateRecipe).toHaveBeenCalledWith('r1', { name: 'Updated' });
    });

    it('RF-06: deleteRecipe delega a crudService', async () => {
      const result = await service.deleteRecipe('r1');
      expect(mockCrud.deleteRecipe).toHaveBeenCalledWith('r1');
      expect(result).toBeTrue();
    });

    it('RF-07: downloadPDF delega a crudService', async () => {
      await service.downloadPDF('r1');
      expect(mockCrud.downloadPDF).toHaveBeenCalledWith('r1');
    });

    it('RF-08: downloadImage delega a crudService', async () => {
      await service.downloadImage('r1');
      expect(mockCrud.downloadImage).toHaveBeenCalledWith('r1');
    });
  });

  // ──────────── Delegación Interaction ────────────
  describe('Delegación Interaction', () => {
    it('RF-09: toggleLike delega a interactionService', async () => {
      await service.toggleLike('r1');
      expect(mockInteraction.toggleLike).toHaveBeenCalledWith('r1');
    });

    it('RF-10: addComment delega a interactionService', async () => {
      await service.addComment('r1', { message: 'test' });
      expect(mockInteraction.addComment).toHaveBeenCalledWith('r1', { message: 'test' });
    });

    it('RF-11: loadComments delega a interactionService', async () => {
      await service.loadComments('r1');
      expect(mockInteraction.loadComments).toHaveBeenCalledWith('r1');
    });

    it('RF-12: deleteComment delega a interactionService', async () => {
      await service.deleteComment('c1');
      expect(mockInteraction.deleteComment).toHaveBeenCalledWith('c1');
    });

    it('RF-13: canUserDeleteComment delega a interactionService', () => {
      const result = service.canUserDeleteComment('u1');
      expect(mockInteraction.canUserDeleteComment).toHaveBeenCalledWith('u1');
      expect(result).toBeTrue();
    });

    it('RF-14: isRecipeLikedByCurrentUser delega a interactionService', () => {
      service.isRecipeLikedByCurrentUser('r1');
      expect(mockInteraction.isRecipeLikedByCurrentUser).toHaveBeenCalledWith('r1');
    });

    it('RF-15: getCurrentUserId delega a interactionService', () => {
      const result = service.getCurrentUserId();
      expect(result).toBe('u1');
    });
  });

  // ──────────── Computed signals ────────────
  describe('Computed signals', () => {
    it('RF-16: recipes() retorna recetas del state', () => {
      expect(service.recipes()).toEqual([DUMMY_RECIPE]);
    });

    it('RF-17: loading() retorna estado de carga', () => {
      expect(service.loading()).toBeFalse();
    });

    it('RF-18: error() retorna null cuando no hay error', () => {
      expect(service.error()).toBeNull();
    });
  });

  // ──────────── updateAuthorForUser ────────────
  describe('updateAuthorForUser', () => {
    it('RF-19: llama updateRecipes del state con mapper correcto (Fake)', () => {
      // Arrange & Act
      service.updateAuthorForUser('chef', 'newchef', 'new-avatar.jpg');

      // Assert
      expect(mockState.updateRecipes).toHaveBeenCalled();

      // Verificar el mapper
      const mapper = mockState.updateRecipes.calls.first().args[0];
      const result = mapper([DUMMY_RECIPE]);
      expect(result[0].user.username).toBe('newchef');
      expect(result[0].user.avatar).toBe('new-avatar.jpg');
    });

    it('RF-20: no modifica recetas de otros usuarios', () => {
      // Arrange & Act
      service.updateAuthorForUser('otro_chef', 'newname');

      // Assert
      const mapper = mockState.updateRecipes.calls.first().args[0];
      const result = mapper([DUMMY_RECIPE]);
      expect(result[0].user.username).toBe('chef'); // sin cambio
    });
  });
});
