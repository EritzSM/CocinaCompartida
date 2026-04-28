import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RecipeCrudService } from '../../../src/app/shared/services/recipe-crud.service';
import { RecipeStateService } from '../../../src/app/shared/services/recipe-state.service';
import { Recipe } from '../../../src/app/shared/interfaces/recipe';

describe('Recetas Populares API Frontend', () => {
  let service: RecipeCrudService;
  let httpMock: HttpTestingController;

  const TOP: Recipe[] = [
    {
      id: 'r1',
      name: 'Pizza',
      descripcion: 'desc',
      ingredients: ['masa'],
      steps: ['hornear'],
      images: ['img.png'],
      category: 'Italiana',
      user: { id: 'u1', username: 'chef' },
      likes: 50,
      likedBy: [],
      comments: [],
    },
  ];

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

  // Verifica que loadTopLikedRecipes llama al endpoint correcto.
  it('RecetasPopularesApi_CuandoSolicitaTopLiked_DebeHacerGet', async () => {
    // Arrange
    flushInitialLoad();

    // Act
    const promise = service.loadTopLikedRecipes();
    const req = httpMock.expectOne('/api/recipes/top-liked');

    // Assert
    expect(req.request.method).toBe('GET');
    req.flush(TOP);
    const result = await promise;
    expect(result).toEqual(TOP);
  });

  // Verifica que un error de API retorna arreglo vacio.
  it('RecetasPopularesApi_CuandoApiFalla_DebeRetornarArrayVacio', async () => {
    // Arrange
    flushInitialLoad();

    // Act
    const promise = service.loadTopLikedRecipes();
    const req = httpMock.expectOne('/api/recipes/top-liked');
    req.flush({ message: 'error' }, { status: 500, statusText: 'Server Error' });
    const result = await promise;

    // Assert
    expect(result).toEqual([]);
  });
});
