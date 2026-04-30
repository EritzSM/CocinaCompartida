import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RecipeInteractionService } from '../../../src/app/shared/services/recipe-interaction.service';
import { RecipeStateService } from '../../../src/app/shared/services/recipe-state.service';
import { Auth } from '../../../src/app/shared/services/auth';
import { Comment as RecipeComment } from '../../../src/app/shared/interfaces/comment';

describe('Ver Comentario Performance Frontend', () => {
  let service: RecipeInteractionService;
  let httpMock: HttpTestingController;

  const COMMENTS: RecipeComment[] = Array.from({ length: 30 }).map((_, i) => ({
    id: `c${i}`,
    message: `comentario ${i}`,
    user: { id: 'u2', username: 'fan' },
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

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

  // Mide latencia promedio sobre N consultas secuenciales de comentarios.
  it('VerComentario_CuandoSeConsultan20VecesSecuencial_LatenciaPromedioDebeSerInferiorA50ms', async () => {
    // Arrange
    const iterations = 20;
    const maxAverageMs = 50;

    // Act
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      const promise = service.loadComments('r1');
      httpMock.expectOne('/api/recipes/r1/comments').flush(COMMENTS);
      await promise;
    }
    const averageMs = (performance.now() - start) / iterations;

    // Assert
    expect(averageMs).toBeLessThan(maxAverageMs);
  });

  // Mide throughput bajo consultas concurrentes.
  it('VerComentario_CuandoSeConsultan10VecesEnParalelo_DebeFinalizarEnMenosDe300ms', async () => {
    // Arrange
    const concurrent = 10;
    const maxTotalMs = 300;

    // Act
    const start = performance.now();
    const promises = Array.from({ length: concurrent }).map(() => service.loadComments('r1'));
    const requests = httpMock.match('/api/recipes/r1/comments');
    requests.forEach(req => req.flush(COMMENTS));
    await Promise.all(promises);
    const totalMs = performance.now() - start;

    // Assert
    expect(totalMs).toBeLessThan(maxTotalMs);
  });
});
