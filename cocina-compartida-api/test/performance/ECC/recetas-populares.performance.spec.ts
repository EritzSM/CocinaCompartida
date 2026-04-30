import { performance } from 'perf_hooks';
import { RecipesService } from '../../../src/recipes/recipes.service';

describe('Recetas Populares Performance Backend', () => {
  const buildService = () => {
    const dataset = Array.from({ length: 50 }).map((_, i) => ({
      id: `r${i}`,
      name: `Receta ${i}`,
      likes: Math.floor(Math.random() * 100),
      likedBy: [],
      comments: [],
    }));
    const recipeRepo = { find: jest.fn().mockResolvedValue(dataset), findOne: jest.fn() };
    const commentRepo = { find: jest.fn(), findOne: jest.fn() };
    return new RecipesService(recipeRepo as any, commentRepo as any);
  };

  // Mide latencia promedio del top liked sobre N consultas secuenciales.
  it('RecetasPopulares_CuandoSeConsultan100Veces_LatenciaPromedioDebeSerInferiorA5ms', async () => {
    // Arrange
    const service = buildService();
    const iterations = 100;
    const maxAverageMs = 5;

    // Act
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      await service.findTopLiked();
    }
    const averageMs = (performance.now() - start) / iterations;

    // Assert
    expect(averageMs).toBeLessThan(maxAverageMs);
  });

  // Mide throughput bajo consultas concurrentes.
  it('RecetasPopulares_CuandoSeConsultan50VecesEnParalelo_DebeFinalizarEnMenosDe200ms', async () => {
    // Arrange
    const service = buildService();
    const concurrent = 50;
    const maxTotalMs = 200;

    // Act
    const start = performance.now();
    await Promise.all(Array.from({ length: concurrent }).map(() => service.findTopLiked()));
    const totalMs = performance.now() - start;

    // Assert
    expect(totalMs).toBeLessThan(maxTotalMs);
  });
});
