import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RecipeCrudService } from '../../../src/app/shared/services/recipe-crud.service';
import { RecipeStateService } from '../../../src/app/shared/services/recipe-state.service';

describe('Recetas Populares Performance Frontend', () => {
  let service: RecipeCrudService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RecipeCrudService, RecipeStateService],
    });

    service = TestBed.inject(RecipeCrudService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushInitialLoad() {
    const req = httpMock.expectOne('/api/recipes');
    req.flush([]);
  }

  // Verifica que solo se realiza una solicitud GET por invocacion.
  it('RecetasPopulares_CuandoSolicitaTopLiked_DebeHacerUnaSolaSolicitud', async () => {
    // Arrange
    flushInitialLoad();

    // Act
    const promise = service.loadTopLikedRecipes();
    const matches = httpMock.match('/api/recipes/top-liked');

    // Assert
    expect(matches.length).toBe(1);
    matches[0].flush([]);
    await promise;
  });
});
