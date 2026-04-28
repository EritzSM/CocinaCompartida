import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RecipeInteractionService } from '../../../src/app/shared/services/recipe-interaction.service';
import { RecipeStateService } from '../../../src/app/shared/services/recipe-state.service';
import { Auth } from '../../../src/app/shared/services/auth';
import { Comment as RecipeComment } from '../../../src/app/shared/interfaces/comment';

describe('Ver Comentario API Frontend', () => {
  let service: RecipeInteractionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        RecipeInteractionService,
        RecipeStateService,
        { provide: Auth, useValue: { getCurrentUser: () => null } },
      ],
    });

    service = TestBed.inject(RecipeInteractionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // Verifica que loadComments usa el endpoint correcto.
  it('VerComentarioApi_CuandoSolicitaComentarios_DebeHacerGetAEndpoint', async () => {
    // Arrange
    const comments: RecipeComment[] = [
      { id: 'c1', message: 'Buenisima', user: { id: 'u1', username: 'fan' }, createdAt: new Date(), updatedAt: new Date() },
      { id: 'c2', message: 'Excelente', user: { id: 'u2', username: 'fan2' }, createdAt: new Date(), updatedAt: new Date() },
    ];

    // Act
    const promise = service.loadComments('r1');
    const req = httpMock.expectOne('/api/recipes/r1/comments');

    // Assert
    expect(req.request.method).toBe('GET');
    req.flush(comments);
    const result = await promise;
    expect(result.length).toBe(2);
    expect(result[0].message).toBe('Buenisima');
  });

  // Verifica que si la API falla se retorna un array vacio.
  it('VerComentarioApi_CuandoApiFalla_DebeRetornarArrayVacio', async () => {
    // Arrange
    const errorBody = { message: 'error' };

    // Act
    const promise = service.loadComments('r1');
    const req = httpMock.expectOne('/api/recipes/r1/comments');
    req.flush(errorBody, { status: 500, statusText: 'Server Error' });
    const result = await promise;

    // Assert
    expect(result).toEqual([]);
  });
});
