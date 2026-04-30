import { performance } from 'perf_hooks';
import { UserService } from '../../../src/user/user.service';

describe('Listar Admin Performance Backend', () => {
  // Mide latencia promedio sobre listados secuenciales con dataset moderado.
  it('ListarAdmin_CuandoSeListan100Veces_LatenciaPromedioDebeSerInferiorA5ms', async () => {
    // Arrange
    const dataset = Array.from({ length: 200 }).map((_, i) => ({
      id: `u${i}`,
      username: `user${i}`,
      password: 'hashed',
    }));
    const userRepo = { find: jest.fn().mockResolvedValue(dataset) };
    const service = new UserService(userRepo as any);
    const iterations = 100;
    const maxAverageMs = 5;

    // Act
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      await service.findAll();
    }
    const averageMs = (performance.now() - start) / iterations;

    // Assert
    expect(averageMs).toBeLessThan(maxAverageMs);
  });

  // Mide throughput bajo listados concurrentes.
  it('ListarAdmin_CuandoSeListan50VecesEnParalelo_DebeFinalizarEnMenosDe200ms', async () => {
    // Arrange
    const userRepo = { find: jest.fn().mockResolvedValue([]) };
    const service = new UserService(userRepo as any);
    const concurrent = 50;
    const maxTotalMs = 200;

    // Act
    const start = performance.now();
    await Promise.all(Array.from({ length: concurrent }).map(() => service.findAll()));
    const totalMs = performance.now() - start;

    // Assert
    expect(totalMs).toBeLessThan(maxTotalMs);
  });
});
