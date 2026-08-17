import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CookingJournalService } from '../shared/services/cooking-journal.service';

describe('CookingJournalService', () => {
  let service: CookingJournalService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CookingJournalService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CookingJournalService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envía la experiencia como formulario asociado a la receta', async () => {
    const photo = new File(['image'], 'resultado.jpg', { type: 'image/jpeg' });
    const promise = service.create('recipe-1', {
      rating: 5,
      preparationNotes: 'Quedó bien',
      ingredientChanges: 'Menos azúcar',
      recommendations: 'Reducir el tiempo',
      photo,
    });

    const request = http.expectOne('/api/recipes/recipe-1/experiences');
    expect(request.request.method).toBe('POST');
    expect(request.request.body instanceof FormData).toBeTrue();
    expect(request.request.body.get('rating')).toBe('5');
    expect(request.request.body.get('photo')).toBe(photo);
    request.flush({ id: 'experience-1', rating: 5 });

    await expectAsync(promise).toBeResolved();
  });

  it('consulta el historial completo del usuario', async () => {
    const promise = service.getMine();
    const request = http.expectOne('/api/cooking-experiences/me');
    expect(request.request.method).toBe('GET');
    request.flush([]);
    await expectAsync(promise).toBeResolvedTo([]);
  });

  it('elimina una experiencia por identificador', async () => {
    const promise = service.remove('experience-1');
    const request = http.expectOne('/api/cooking-experiences/experience-1');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    await expectAsync(promise).toBeResolved();
  });
});
