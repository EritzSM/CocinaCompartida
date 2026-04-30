import { performance } from 'perf_hooks';
import { UserService } from '../../../src/user/user.service';

describe('Editar Perfil Performance Backend', () => {
  const buildService = () => {
    const userRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'u1', username: 'old', email: 'test@test.com' }),
      update: jest.fn().mockResolvedValue({}),
    };
    return { service: new UserService(userRepo as any), userRepo };
  };

  // Mide latencia promedio del update sobre N invocaciones secuenciales.
  it('EditarPerfil_CuandoSeEjecutan100Updates_LatenciaPromedioDebeSerInferiorA5ms', async () => {
    // Arrange
    const { service } = buildService();
    const iterations = 100;
    const maxAverageMs = 5;

    // Act
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      await service.update('u1', { username: `nuevo_${i}` } as any);
    }
    const totalMs = performance.now() - start;
    const averageMs = totalMs / iterations;

    // Assert
    expect(averageMs).toBeLessThan(maxAverageMs);
  });

  // Mide throughput bajo carga concurrente.
  it('EditarPerfil_CuandoSeEjecutan50UpdatesEnParalelo_DebeFinalizarEnMenosDe200ms', async () => {
    // Arrange
    const { service } = buildService();
    const concurrentRequests = 50;
    const maxTotalMs = 200;

    // Act
    const start = performance.now();
    await Promise.all(
      Array.from({ length: concurrentRequests }).map((_, i) =>
        service.update('u1', { username: `usr_${i}` } as any)
      )
    );
    const totalMs = performance.now() - start;

    // Assert
    expect(totalMs).toBeLessThan(maxTotalMs);
  });
});
