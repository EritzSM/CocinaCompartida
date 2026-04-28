import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import Swal from 'sweetalert2';
import { RecipeInteractionService } from '../../../src/app/shared/services/recipe-interaction.service';
import { RecipeStateService } from '../../../src/app/shared/services/recipe-state.service';
import { Auth } from '../../../src/app/shared/services/auth';
import { Recipe } from '../../../src/app/shared/interfaces/recipe';

describe('Eliminar Comentario Performance Frontend', () => {
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

  // Verifica que se realiza una sola llamada DELETE por eliminacion.
  it('EliminarComentario_CuandoElimina_DebeEnviarUnaSolaSolicitud', async () => {
    // Arrange
    state.setRecipes([RECIPE]);

    // Act
    const promise = service.deleteComment('c1');
    const matches = httpMock.match('/api/recipes/comments/c1');

    // Assert
    expect(matches.length).toBe(1);
    matches[0].flush({});
    await promise;
  });
});
