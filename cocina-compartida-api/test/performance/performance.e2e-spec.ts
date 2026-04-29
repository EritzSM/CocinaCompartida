import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../../src/app.module';

import { Actor } from '../screenplay/actor/Actor';
import { ConsumeApi } from '../screenplay/abilities/ConsumeApi';
import { ListarRecetas } from '../screenplay/tasks/recipes/ListarRecetas';
import { LaRespuesta } from '../screenplay/questions/LaRespuesta';
import { Afirmar } from '../screenplay/fluent/Afirmar';

describe('Performance Checks (e2e) — Patrón Screenplay', () => {
  let app: INestApplication;

  // ─── Setup / Teardown ─────────────────────────────────────────────────────
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Tiempos de Respuesta ─────────────────────────────────────────────────
  describe('Tiempos de Respuesta (Response Times)', () => {

    it('Dado el sistema bajo condición normal, cuando se obtiene la lista de recetas, entonces debe resolverse en menos de 300ms', async () => {
      // Arrange — El sistema como actor que mide su propio rendimiento
      const sistema = Actor.llamado('Sistema').con(ConsumeApi.usando(app));
      const LIMITE_MS = 300;

      // Act — El sistema ejecuta la tarea y registra el tiempo
      const respuesta = await sistema.intentar(ListarRecetas.ahora());

      // Assert — Fluent assertions sobre status y tiempo
      Afirmar.que(LaRespuesta.statusDe(respuesta)).esIgualA(200);
      Afirmar.que(LaRespuesta.duracionDe(respuesta)).esMenorQue(LIMITE_MS);

      console.log(
        `[Performance] GET /recipes completado en ${LaRespuesta.duracionDe(respuesta)}ms`,
      );
    });
  });

  // ─── Carga Concurrente Leve (Throughput) ──────────────────────────────────
  describe('Prueba de Carga Concurrente Leve (Throughput)', () => {

    it('Dado 15 usuarios simultáneos, cuando todos consultan recetas a la vez, entonces el sistema debe responder en menos de 1000ms sin errores', async () => {
      // Arrange — 15 actores simulando usuarios concurrentes
      const CANTIDAD_PETICIONES = 15;
      const LIMITE_MS = 1000;

      const actores = Array.from({ length: CANTIDAD_PETICIONES }, (_, i) =>
        Actor.llamado(`UsuarioConcurrente_${i + 1}`).con(ConsumeApi.usando(app)),
      );

      // Act — Todos los actores ejecutan la tarea simultáneamente
      const inicio = Date.now();
      const respuestas = await Promise.all(
        actores.map((actor) => actor.intentar(ListarRecetas.ahora())),
      );
      const duracionTotal = Date.now() - inicio;

      // Assert — Ninguna petición falló y el tiempo total fue aceptable
      respuestas.forEach((respuesta, i) => {
        Afirmar.que(LaRespuesta.statusDe(respuesta))
          .esIgualA(200);
      });
      Afirmar.que(duracionTotal).esMenorQue(LIMITE_MS);

      console.log(
        `[Performance] ${CANTIDAD_PETICIONES} peticiones concurrentes completadas en ${duracionTotal}ms`,
      );
    });
  });
});
