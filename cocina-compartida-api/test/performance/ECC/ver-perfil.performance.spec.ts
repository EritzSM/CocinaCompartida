import { performance } from 'perf_hooks';
import { UserService } from '../../../src/user/user.service';

describe('Ver Perfil Performance Backend', () => {
  const DB_USER = {
    id: '1',
    username: 'testuser',
    password: 'hashed',
    email: 'test@test.com',
    avatar: 'av.png',
    bio: 'bio',
  };

  const buildService = () => {
    const userRepo = { findOne: jest.fn().mockResolvedValue({ ...DB_USER }) };
    return new UserService(userRepo as any);
  };

  // Mide latencia promedio del findOne sobre N invocaciones secuenciales.
  it('VerPerfil_CuandoSeConsulta100Veces_LatenciaPromedioDebeSerInferiorA5ms', async () => {
    // Arrange
    const service = buildService();
    const iterations = 100;
    const maxAverageMs = 5;

    // Act
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      await service.findOne('1');
    }
    const averageMs = (performance.now() - start) / iterations;

    // Assert
    expect(averageMs).toBeLessThan(maxAverageMs);
  });

  // Mide throughput bajo consultas concurrentes de perfil.
  it('VerPerfil_CuandoSeConsulta50VecesEnParalelo_DebeFinalizarEnMenosDe200ms', async () => {
    // Arrange
    const service = buildService();
    const concurrent = 50;
    const maxTotalMs = 200;

    // Act
    const start = performance.now();
    await Promise.all(Array.from({ length: concurrent }).map(() => service.findOne('1')));
    const totalMs = performance.now() - start;

    // Assert
    expect(totalMs).toBeLessThan(maxTotalMs);
  });
});
