import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PortionScalingService } from '../shared/services/portion-scaling.service';

describe('PortionScalingService', () => {
  let service: PortionScalingService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PortionScalingService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PortionScalingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('solicita los ingredientes calculados para las porciones seleccionadas', async () => {
    const promise = service.scale('recipe-1', 5);
    const request = http.expectOne(
      (candidate) =>
        candidate.url === '/api/recipes/recipe-1/scaled-ingredients' &&
        candidate.params.get('servings') === '5',
    );

    expect(request.request.method).toBe('GET');
    request.flush({
      recipeId: 'recipe-1',
      originalServings: 2,
      selectedServings: 5,
      scaleFactor: 2.5,
      ingredients: [{ original: '200 g de pasta', adjusted: '500 g de pasta', scalable: true }],
    });

    const result = await promise;
    expect(result.ingredients[0].adjusted).toBe('500 g de pasta');
  });
});
