import { performance } from 'perf_hooks';
import { RecipesService } from '../../../src/recipes/recipes.service';

describe('Eliminar Comentario Performance Backend', () => {
  const COMMENT = { id: 'c1', message: 'ok', user: { id: 'u1', username: 'chef' } };

  const buildService = () => {
    const recipeRepo = { findOne: jest.fn() };
    const commentRepo = {
      findOne: jest.fn().mockResolvedValue({ ...COMMENT }),
      softRemove: jest.fn().mockResolvedValue(undefined),
    };
    return new RecipesService(recipeRepo as any, commentRepo as any);
  };

  // Mide latencia promedio sobre N eliminaciones secuenciales.
  it('EliminarComentario_CuandoSeEjecutan100Eliminaciones_LatenciaPromedioDebeSerInferiorA5ms', async () => {
    // Arrange
    const service = buildService();
    const owner = { id: 'u1', username: 'chef' };
    const iterations = 100;
    const maxAverageMs = 5;

    // Act
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      await service.removeComment('c1', owner as any);
    }
    const averageMs = (performance.now() - start) / iterations;

    // Assert
    expect(averageMs).toBeLessThan(maxAverageMs);
  });

  // Mide throughput bajo eliminaciones concurrentes.
  it('EliminarComentario_CuandoSeEjecutan50EliminacionesEnParalelo_DebeFinalizarEnMenosDe200ms', async () => {
    // Arrange
    const service = buildService();
    const owner = { id: 'u1', username: 'chef' };
    const concurrent = 50;
    const maxTotalMs = 200;

    // Act
    const start = performance.now();
    await Promise.all(
      Array.from({ length: concurrent }).map(() => service.removeComment('c1', owner as any))
    );
    const totalMs = performance.now() - start;

    // Assert
    expect(totalMs).toBeLessThan(maxTotalMs);
  });
});
