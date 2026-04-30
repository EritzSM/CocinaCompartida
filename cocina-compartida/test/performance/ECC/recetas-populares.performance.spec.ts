import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RecipeCrudService } from '../../../src/app/shared/services/recipe-crud.service';
import { RecipeStateService } from '../../../src/app/shared/services/recipe-state.service';
import { Recipe } from '../../../src/app/shared/interfaces/recipe';

describe('Recetas Populares Performance Frontend', () => {
  let service: RecipeCrudService;
  let httpMock: HttpTestingController;

  const TOP: Recipe[] = Array.from({ length: 25 }).map((_, i) => ({
    id: `r${i}`,
    name: `Receta ${i}`,
    descripcion: 'desc',
    ingredients: ['x'],
    steps: ['s'],
    images: ['img.png'],
    category: 'cat',
    user: { id: 'u1', username: 'chef' },
    likes: 50 - i,
    likedBy: [],
    comments: [],
  }));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RecipeCrudService, RecipeStateService],
    });

    service = TestBed.inject(RecipeCrudService);
    httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('/api/recipes').flush([]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // Mide latencia promedio sobre N consultas secuenciales del top liked.
  it('RecetasPopulares_CuandoSeConsultan20VecesSecuencial_LatenciaPromedioDebeSerInferiorA50ms', async () => {
    // Arrange
    const iterations = 20;
    const maxAverageMs = 50;

    // Act
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      const promise = service.loadTopLikedRecipes();
      httpMock.expectOne('/api/recipes/top-liked').flush(TOP);
      await promise;
    }
    const averageMs = (performance.now() - start) / iterations;

    // Assert
    expect(averageMs).toBeLessThan(maxAverageMs);
  });

  // Mide throughput bajo consultas concurrentes.
  it('RecetasPopulares_CuandoSeConsultan10VecesEnParalelo_DebeFinalizarEnMenosDe300ms', async () => {
    // Arrange
    const concurrent = 10;
    const maxTotalMs = 300;

    // Act
    const start = performance.now();
    const promises = Array.from({ length: concurrent }).map(() => service.loadTopLikedRecipes());
    const requests = httpMock.match('/api/recipes/top-liked');
    requests.forEach(req => req.flush(TOP));
    await Promise.all(promises);
    const totalMs = performance.now() - start;

    // Assert
    expect(totalMs).toBeLessThan(maxTotalMs);
  });
});
