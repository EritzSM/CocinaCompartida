import { performance } from 'perf_hooks';
import { RecipesService } from '../../../src/recipes/recipes.service';

const RECIPE = {
  id: 'r1',
  name: 'Pasta',
  descripcion: 'desc',
  ingredients: ['pasta'],
  steps: ['cocinar'],
  images: [],
  category: 'Italiana',
  likes: 0,
  likedBy: [],
  user: { id: 'u1', username: 'chef' },
  comments: [],
};

describe('Ver Comentario Performance Backend', () => {
  const buildService = () => {
    const comments = Array.from({ length: 50 }).map((_, i) => ({
      id: `c${i}`,
      message: `comentario ${i}`,
      user: { id: 'u2', username: 'fan' },
    }));
    const recipeRepo = { findOne: jest.fn().mockResolvedValue({ ...RECIPE }) };
    const commentRepo = { find: jest.fn().mockResolvedValue(comments) };
    return new RecipesService(recipeRepo as any, commentRepo as any);
  };

  // Mide latencia promedio sobre N consultas secuenciales de comentarios.
  it('VerComentario_CuandoSeConsultan100Veces_LatenciaPromedioDebeSerInferiorA5ms', async () => {
    // Arrange
    const service = buildService();
    const iterations = 100;
    const maxAverageMs = 5;

    // Act
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      await service.findCommentsByRecipe('r1');
    }
    const averageMs = (performance.now() - start) / iterations;

    // Assert
    expect(averageMs).toBeLessThan(maxAverageMs);
  });

  // Mide throughput bajo consultas concurrentes de comentarios.
  it('VerComentario_CuandoSeConsultan50VecesEnParalelo_DebeFinalizarEnMenosDe200ms', async () => {
    // Arrange
    const service = buildService();
    const concurrent = 50;
    const maxTotalMs = 200;

    // Act
    const start = performance.now();
    await Promise.all(
      Array.from({ length: concurrent }).map(() => service.findCommentsByRecipe('r1'))
    );
    const totalMs = performance.now() - start;

    // Assert
    expect(totalMs).toBeLessThan(maxTotalMs);
  });
});
