import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RecipeInteractionService } from '../shared/services/recipe-interaction.service';
import { RecipeStateService } from '../shared/services/recipe-state.service';
import { Auth } from '../shared/services/auth';
import { Comment as RecipeComment } from '../shared/interfaces/comment';
import { Recipe } from '../shared/interfaces/recipe';
import Swal from 'sweetalert2';

describe('Frontend - RecipeInteractionService (Comentarios)', () => {
  let service: RecipeInteractionService;
  let httpMock: HttpTestingController;
  let stateSpy: jasmine.SpyObj<RecipeStateService>;
  let authSpy: jasmine.SpyObj<Auth>;

  beforeEach(() => {
    // Arrange global
    // Test Double (Spy): estado central de recetas y auth
    stateSpy = jasmine.createSpyObj('RecipeStateService', [
      'getRecipeCommentsUrl', 'getAuthOptions', 'updateRecipes',
      'rollbackRecipes', 'setError', 'getCommentUrl', 'recipes',
      'getRecipeLikeUrl', 'getRecipeById'
    ]);

    authSpy = jasmine.createSpyObj('Auth', ['getCurrentUser']);

    // Test Double (Stub): Por defecto auth options devuelve un header simulado
    stateSpy.getAuthOptions.and.returnValue({ headers: {} } as any);

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        RecipeInteractionService,
        { provide: RecipeStateService, useValue: stateSpy },
        { provide: Auth, useValue: authSpy }
      ]
    });

    service = TestBed.inject(RecipeInteractionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ──────────────────────────────────────────────────────────
  // C-01 a C-04: Gestión de Comentarios
  // ──────────────────────────────────────────────────────────
  describe('addComment() – C-01 / C-02', () => {
    it('C-01: debe hacer POST al enpoint correcto, y actualizar optimístamente las recetas', async () => {
      // Arrange
      const recipeId = 'uuid-recipe-1';
      // Test Double (Dummy): Payload de mensaje a enviar
      const newCommentData = { message: '¡Muy buena receta C-01!' };
      // Test Double (Dummy): Retorno oficial del backend con id temporal y fechas
      const savedComment = { id: 'c-123', message: '¡Muy buena receta C-01!' } as RecipeComment;

      // Configuración de URLs dentro del State Stub (Fake URL resolution)
      stateSpy.getRecipeCommentsUrl.and.returnValue('/api/recipes/uuid-recipe-1/comments');

      // Act
      const commentPromise = service.addComment(recipeId, newCommentData);

      // Assert (Mock HTTP validation)
      const req = httpMock.expectOne('/api/recipes/uuid-recipe-1/comments');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newCommentData); // Validamos que el body vaya integro

      // Enviamos flush
      req.flush(savedComment);
      await commentPromise;

      // Verificamos si se invocó la actualización interna de Recipes en el frontend (Optimistic UI fallback pattern)
      expect(stateSpy.updateRecipes).toHaveBeenCalled();
    });

    it('C-02/Error nativo: debe rollbackear y triggerear setError si falla (Test Double Stub de Error)', async () => {
      // Arrange
      const recipeId = 'uuid-recipe-error';
      const newCommentData = { message: '' }; // C-02: Comentario vacío, el backend rechaza con 400
      stateSpy.getRecipeCommentsUrl.and.returnValue(`/api/recipes/${recipeId}/comments`);

      // Act
      const commentPromise = service.addComment(recipeId, newCommentData);

      // Test Double (Stub): Error 400 Bad Request
      const req = httpMock.expectOne(`/api/recipes/${recipeId}/comments`);
      req.flush({ message: 'El comentario no puede estar vacío' }, { status: 400, statusText: 'Bad Request' });

      await commentPromise;

      // Assert
      // Verificamos que se ejecutó set Error por fallo del POST
      expect(stateSpy.setError).toHaveBeenCalledWith('No se pudo agregar el comentario');
    });
  });

  describe('deleteComment() – Caminos adicionales / C-04', () => {
    it('debe hacer DELETE, guardar previous state y remover el comentario del estado global (Optimistic Update pattern)', async () => {
      // Arrange
      const commentId = 'c-to-delete';
      stateSpy.getCommentUrl.and.returnValue(`/api/recipes/comments/${commentId}`);
      stateSpy.recipes.and.returnValue([{ id: 'r1', comments: [{ id: commentId } as RecipeComment] }] as any[]);

      // Act
      const deletePromise = service.deleteComment(commentId);
      
      // Esperar al microtask del Swal.fire promise de forma robusta
      await new Promise(r => setTimeout(r, 0));

      // Assert & Mock Response
      const req = httpMock.expectOne(`/api/recipes/comments/${commentId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});

      await deletePromise;
      
      // Se guardó previous state
      expect(stateSpy.recipes).toHaveBeenCalled();
      // Y se actualizó localmente (removeCommentFromAllRecipes llama a updateRecipes)
      expect(stateSpy.updateRecipes).toHaveBeenCalled();
    });

    it('debe usar rollbackRecipes() si falla la eliminación', async () => {
      // Arrange
      const commentId = 'error-delete';
      stateSpy.getCommentUrl.and.returnValue(`/api/recipes/comments/${commentId}`);
      // Recuperar estado ficticio inicial - DEBE CONTENER EL COMENTARIO para pasar la validación de existencia
      const previousDummyState = [{ id: 'r1', comments: [{ id: commentId } as RecipeComment] }] as Recipe[];
      stateSpy.recipes.and.returnValue(previousDummyState as any);

      // Act
      const deletePromise = service.deleteComment(commentId);
      
      // Esperar microtask de Swal.fire de forma robusta
      await new Promise(r => setTimeout(r, 0));

      // Fallo 500 simulado
      httpMock.expectOne(`/api/recipes/comments/${commentId}`).flush(null, { status: 500, statusText: 'Error' });
      await deletePromise;

      // Assert
      expect(stateSpy.rollbackRecipes).toHaveBeenCalledWith(previousDummyState);
      expect(stateSpy.setError).toHaveBeenCalledWith('No se pudo eliminar el comentario');
    });
  });

  describe('canUserDeleteComment()', () => {
    it('debe retornar verdadero si el ID del autor coincide con el ID del user logueado (Mock Authorization local)', () => {
      // Arrange
      // Stub: Simulate logged array
      authSpy.getCurrentUser.and.returnValue({ id: 'my-user-id' } as any);

      // Act
      const canDeleteOwn = service.canUserDeleteComment('my-user-id');
      const canDeleteOther = service.canUserDeleteComment('another-user-id');

      // Assert
      expect(canDeleteOwn).toBeTrue();
      expect(canDeleteOther).toBeFalse();
    });

    it('debe retornar falso si no hay nadie logueado (Stub de usuario nulo)', () => {
      // Arrange
      authSpy.getCurrentUser.and.returnValue(null);

      // Act
      const result = service.canUserDeleteComment('any-id');

      // Assert
      expect(result).toBeFalse();
    });
  });
});
