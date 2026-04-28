import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RecipeInteractionService } from '../../../src/app/shared/services/recipe-interaction.service';
import { RecipeStateService } from '../../../src/app/shared/services/recipe-state.service';
import { Auth } from '../../../src/app/shared/services/auth';

describe('Ver Comentario Security Frontend', () => {
  let service: RecipeInteractionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.setItem('token', 'token');

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
    localStorage.removeItem('token');
  });

  // Verifica que el endpoint publico no envia Authorization.
  it('VerComentario_CuandoCargaComentarios_NoDebeEnviarAuthorization', async () => {
    // Arrange
    const recipeId = 'r1';

    // Act
    const promise = service.loadComments(recipeId);
    const req = httpMock.expectOne('/api/recipes/r1/comments');

    // Assert
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
    await promise;
  });

  // Verifica que un error de API no expone detalles y retorna lista vacia.
  it('VerComentario_CuandoApiFalla_DebeRetornarListaVacia', async () => {
    // Arrange
    const recipeId = 'r1';

    // Act
    const promise = service.loadComments(recipeId);
    const req = httpMock.expectOne('/api/recipes/r1/comments');
    req.flush({ message: 'error' }, { status: 500, statusText: 'Server Error' });
    const result = await promise;

    // Assert
    expect(result).toEqual([]);
  });
});
