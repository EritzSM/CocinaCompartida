import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RecipeCrudService } from '../../../src/app/shared/services/recipe-crud.service';
import { RecipeStateService } from '../../../src/app/shared/services/recipe-state.service';
import { Recipe } from '../../../src/app/shared/interfaces/recipe';

describe('Recetas Populares Security Frontend', () => {
  let service: RecipeCrudService;
  let httpMock: HttpTestingController;

  const TOP_RECIPES: Recipe[] = [
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
    localStorage.removeItem('token');
  });

  function flushInitialLoad(): void {
    const req = httpMock.expectOne('/api/recipes');
    req.flush([]);
  }

  it('RecetasPopulares_CuandoSolicitaTopLiked_NoDebeEnviarAuthorizationHeader', async () => {
    // Arrange
    localStorage.setItem('token', 'token');
    flushInitialLoad();

    // Act
    const promise = service.loadTopLikedRecipes();
    const req = httpMock.expectOne('/api/recipes/top-liked');

    // Assert
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush(TOP_RECIPES);
    const result = await promise;
    expect(result.length).toBe(1);
  });

  it('RecetasPopulares_CuandoApiFalla_DebeRetornarArrayVacio', async () => {
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
