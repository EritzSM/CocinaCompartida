import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RecipeInteractionService } from '../shared/services/recipe-interaction.service';
import { RecipeStateService } from '../shared/services/recipe-state.service';
import { Auth } from '../shared/services/auth';
import { Recipe } from '../shared/interfaces/recipe';
import { Comment as RecipeComment } from '../shared/interfaces/comment';
import Swal from 'sweetalert2';

function recipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'r-base',
    name: 'Receta',
    descripcion: 'Descripcion',
    ingredients: ['ing'],
    steps: ['paso'],
    images: ['img.jpg'],
    category: 'cena',
    user: { id: 'u-chef', username: 'chef' },
    likes: 0,
    likedBy: [],
    comments: [],
    ...overrides
  };
}

describe('RecipeInteractionService - cobertura complementaria', () => {
  let service: RecipeInteractionService;
  let httpMock: HttpTestingController;
  let stateSpy: jasmine.SpyObj<RecipeStateService>;
  let authSpy: jasmine.SpyObj<Auth>;

  beforeEach(() => {
    stateSpy = jasmine.createSpyObj('RecipeStateService', [
      'getRecipeCommentsUrl',
      'getAuthOptions',
      'updateRecipes',
      'rollbackRecipes',
      'setError',
      'getCommentUrl',
      'recipes',
      'getRecipeLikeUrl',
      'getRecipeById'
    ]);
    authSpy = jasmine.createSpyObj('Auth', ['getCurrentUser']);
    stateSpy.getAuthOptions.and.returnValue({ headers: {} } as any);
    spyOn(console, 'error');

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

  it('RI-X01: toggleLike no hace nada si no hay usuario autenticado', async () => {
    authSpy.getCurrentUser.and.returnValue(null);

    await service.toggleLike('r1');

    expect(stateSpy.updateRecipes).not.toHaveBeenCalled();
  });

  it('RI-X02: toggleLike aplica actualizacion optimista y confirma respuesta valida', async () => {
    let currentRecipes = [
      recipe({ id: 'r1', likedBy: [], likes: 0, comments: [] }),
      recipe({ id: 'r2', likedBy: [], likes: 0, comments: [] })
    ];
    authSpy.getCurrentUser.and.returnValue({ id: 'u1' } as any);
    (stateSpy.recipes as any).and.callFake(() => currentRecipes);
    stateSpy.getRecipeLikeUrl.and.returnValue('/api/recipes/r1/like');
    stateSpy.updateRecipes.and.callFake((updater: any) => {
      currentRecipes = updater(currentRecipes);
    });

    const promise = service.toggleLike('r1');
    expect(currentRecipes[0].likedBy).toEqual(['u1']);
    expect(currentRecipes[0].likes).toBe(1);

    const req = httpMock.expectOne('/api/recipes/r1/like');
    expect(req.request.method).toBe('POST');
    req.flush({ likes: 3, likedBy: ['u1', 'u2', 'u3'] });
    await promise;

    expect(currentRecipes[0].likedBy).toEqual(['u1', 'u2', 'u3']);
    expect(currentRecipes[0].likes).toBe(3);
  });

  it('RI-X03: toggleLike revierte estado si falla el backend', async () => {
    const previousState = [recipe({ id: 'r1', likedBy: [], likes: 0 })];
    authSpy.getCurrentUser.and.returnValue({ id: 'u1' } as any);
    stateSpy.recipes.and.returnValue(previousState);
    stateSpy.getRecipeLikeUrl.and.returnValue('/api/recipes/r1/like');

    const promise = service.toggleLike('r1');
    httpMock.expectOne('/api/recipes/r1/like').flush(null, { status: 500, statusText: 'Error' });
    await promise;

    expect(stateSpy.rollbackRecipes).toHaveBeenCalledWith(previousState);
    expect(stateSpy.setError).toHaveBeenCalledWith('No se pudo actualizar el like');
  });

  it('RI-X04: toggleLike ignora confirmacion invalida y conserva estado optimista', async () => {
    let currentRecipes = [recipe({ id: 'r1', likedBy: ['u1'], likes: 1 })];
    authSpy.getCurrentUser.and.returnValue({ id: 'u1' } as any);
    (stateSpy.recipes as any).and.callFake(() => currentRecipes);
    stateSpy.getRecipeLikeUrl.and.returnValue('/api/recipes/r1/like');
    stateSpy.updateRecipes.and.callFake((updater: any) => {
      currentRecipes = updater(currentRecipes);
    });

    const promise = service.toggleLike('r1');
    httpMock.expectOne('/api/recipes/r1/like').flush({ likes: 'mal', likedBy: [] });
    await promise;

    expect(currentRecipes[0].likedBy).toEqual([]);
    expect(currentRecipes[0].likes).toBe(0);
  });

  it('RI-X05: loadComments retorna comentarios o arreglo vacio ante error', async () => {
    stateSpy.getRecipeCommentsUrl.and.returnValue('/api/recipes/r1/comments');
    const okPromise = service.loadComments('r1');
    httpMock.expectOne('/api/recipes/r1/comments').flush([{ id: 'c1' } as RecipeComment]);
    expect(await okPromise).toEqual([{ id: 'c1' } as RecipeComment]);

    const failPromise = service.loadComments('r1');
    httpMock.expectOne('/api/recipes/r1/comments').flush(null, { status: 500, statusText: 'Error' });
    expect(await failPromise).toEqual([]);
  });

  it('RI-X06: deleteComment corta si el comentario no existe o si se cancela', async () => {
    stateSpy.recipes.and.returnValue([recipe({ id: 'r1', comments: [] })]);

    await service.deleteComment('missing');

    expect(stateSpy.setError).toHaveBeenCalledWith('El comentario no existe');

    (Swal.fire as any)?.calls?.reset?.();
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: false } as any));
    stateSpy.setError.calls.reset();
    stateSpy.recipes.and.returnValue([recipe({ id: 'r1', comments: [{ id: 'c1' } as RecipeComment] })]);

    await service.deleteComment('c1');

    expect(stateSpy.setError).not.toHaveBeenCalled();
    expect(stateSpy.updateRecipes).not.toHaveBeenCalled();
  });

  it('RI-X07: helpers de usuario y like cubren true, false y null', () => {
    authSpy.getCurrentUser.and.returnValue({ id: 'u1' } as any);
    stateSpy.getRecipeById.and.returnValue(recipe({ id: 'r1', likedBy: ['u1'] }));

    expect(service.isRecipeLikedByCurrentUser('r1')).toBeTrue();
    expect(service.getCurrentUserId()).toBe('u1');

    stateSpy.getRecipeById.and.returnValue(recipe({ id: 'r1', likedBy: [] }));
    expect(service.isRecipeLikedByCurrentUser('r1')).toBeFalse();

    authSpy.getCurrentUser.and.returnValue(null);
    expect(service.isRecipeLikedByCurrentUser('r1')).toBeFalse();
    expect(service.getCurrentUserId()).toBeNull();
  });
});
