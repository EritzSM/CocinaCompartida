import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import Swal from 'sweetalert2';
import { RecipeInteractionService } from '../../../src/app/shared/services/recipe-interaction.service';
import { RecipeStateService } from '../../../src/app/shared/services/recipe-state.service';
import { Auth } from '../../../src/app/shared/services/auth';
import { Recipe } from '../../../src/app/shared/interfaces/recipe';

describe('Eliminar Comentario Regression Frontend', () => {
  let service: RecipeInteractionService;
  let state: RecipeStateService;
  let httpMock: HttpTestingController;

  const RECIPE: Recipe = {
    id: 'r1',
    name: 'Pasta',
    descripcion: 'desc',
    ingredients: ['pasta'],
    steps: ['cocinar'],
    images: ['img.png'],
    category: 'Italiana',
    user: { id: 'u1', username: 'chef' },
    comments: [
      {
        id: 'c1',
        message: 'Buen comentario',
        user: { id: 'u2', username: 'fan' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        RecipeInteractionService,
        RecipeStateService,
        { provide: Auth, useValue: { getCurrentUser: () => ({ id: 'u1' }) } },
      ],
    });

    service = TestBed.inject(RecipeInteractionService);
    state = TestBed.inject(RecipeStateService);
    httpMock = TestBed.inject(HttpTestingController);

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
  });

  afterEach(() => {
    httpMock.verify();
  });

  // Verifica que eliminar un comentario existente actualiza el estado.
  it('EliminarComentario_CuandoExisteYConfirma_DebeEliminarDelEstado', async () => {
    // Arrange
    state.setRecipes([RECIPE]);

    // Act
    const promise = service.deleteComment('c1');
    const req = httpMock.expectOne('/api/recipes/comments/c1');
    req.flush({});
    await promise;

    // Assert
    const recipes = state.recipes();
    expect(recipes[0].comments!.length).toBe(0);
    expect(state.error()).toBeNull();
  });

  // Verifica que si el comentario no existe se setea error y no se llama a la API.
  it('EliminarComentario_CuandoIdNoExiste_DebeSetearErrorYSinLlamarApi', async () => {
    // Arrange
    state.setRecipes([RECIPE]);

    // Act
    await service.deleteComment('missing');

    // Assert
    httpMock.expectNone('/api/recipes/comments/missing');
    expect(state.error()).toBe('El comentario no existe');
  });
});
