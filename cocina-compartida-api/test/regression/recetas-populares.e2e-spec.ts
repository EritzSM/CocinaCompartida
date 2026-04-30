import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

import { Actor } from '../screenplay/actor/Actor';
import { ConsumeApi } from '../screenplay/abilities/ConsumeApi';
import { ListarRecetasPopulares } from '../screenplay/tasks/recipes/ListarRecetasPopulares';
import { LaRespuesta } from '../screenplay/questions/LaRespuesta';
import { Afirmar } from '../screenplay/fluent/Afirmar';

describe('Regresión: Recetas Populares — top-liked (e2e)', () => {
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

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 1: API & Contrato — GET /recipes/top-liked
  // ═══════════════════════════════════════════════════════════════════════════
  describe('API & Contrato', () => {

    it('Dado el endpoint de recetas populares, cuando se consulta, entonces devuelve status 200 con un arreglo', async () => {
      // Arrange
      const visitante = Actor.llamado('VisitantePopulares').con(ConsumeApi.usando(app));

      // Act
      const respuesta = await visitante.intentar(ListarRecetasPopulares.ahora());

      // Assert
      Afirmar.que(LaRespuesta.statusDe(respuesta)).esIgualA(200);
      Afirmar.que(LaRespuesta.cuerpoDe(respuesta)).esUnArreglo();
    });

    it('Dado recetas populares devueltas, cada una debe tener las propiedades id, name y likes', async () => {
      // Arrange
      const visitante = Actor.llamado('ValidadorContrato').con(ConsumeApi.usando(app));

      // Act
      const respuesta = await visitante.intentar(ListarRecetasPopulares.ahora());

      // Assert — Validación de tipos/propiedades en cada elemento
      const body = LaRespuesta.cuerpoDe(respuesta) as any[];
      body.forEach((receta, index) => {
        expect(receta).toHaveProperty('id');
        expect(receta).toHaveProperty('name');
        expect(receta).toHaveProperty('likes');
        expect(typeof receta.name).toBe('string');
        expect(typeof receta.likes).toBe('number');
      });
    });

    it('Dado el default, cuando se consulta top-liked, entonces devuelve como máximo 3 recetas', async () => {
      // Arrange
      const visitante = Actor.llamado('ValidadorLimite').con(ConsumeApi.usando(app));

      // Act
      const respuesta = await visitante.intentar(ListarRecetasPopulares.ahora());

      // Assert
      Afirmar.que(LaRespuesta.statusDe(respuesta)).esIgualA(200);
      const body = LaRespuesta.cuerpoDe(respuesta) as any[];
      expect(body.length).toBeLessThanOrEqual(3);
    });

    it('Dado las recetas populares, deben estar ordenadas por likes de mayor a menor', async () => {
      // Arrange
      const visitante = Actor.llamado('ValidadorOrden').con(ConsumeApi.usando(app));

      // Act
      const respuesta = await visitante.intentar(ListarRecetasPopulares.ahora());

      // Assert — Cada receta tiene likes >= la siguiente
      const body = LaRespuesta.cuerpoDe(respuesta) as any[];
      for (let i = 1; i < body.length; i++) {
        expect(body[i - 1].likes).toBeGreaterThanOrEqual(body[i].likes);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 2: Rendimiento — Latencia y Carga
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Rendimiento — Latencia', () => {

    it('Dado el sistema bajo condición normal, GET /recipes/top-liked debe responder en menos de 200ms', async () => {
      // Arrange
      const sistema = Actor.llamado('MedidorLatencia').con(ConsumeApi.usando(app));
      const LIMITE_MS = 200;

      // Act
      const respuesta = await sistema.intentar(ListarRecetasPopulares.ahora());

      // Assert
      Afirmar.que(LaRespuesta.statusDe(respuesta)).esIgualA(200);
      Afirmar.que(LaRespuesta.duracionDe(respuesta)).esMenorQue(LIMITE_MS);

      console.log(
        `[Rendimiento] GET /recipes/top-liked completado en ${LaRespuesta.duracionDe(respuesta)}ms`,
      );
    });
  });

  describe('Rendimiento — Carga Concurrente', () => {

    it('Dado 10 usuarios simultáneos, cuando todos consultan top-liked a la vez, el sistema responde en menos de 500ms sin errores', async () => {
      // Arrange — 10 actores simulando usuarios concurrentes
      const CANTIDAD = 10;
      const LIMITE_MS = 500;

      const actores = Array.from({ length: CANTIDAD }, (_, i) =>
        Actor.llamado(`Concurrente_${i + 1}`).con(ConsumeApi.usando(app)),
      );

      // Act — Todos ejecutan la tarea simultáneamente
      const inicio = Date.now();
      const respuestas = await Promise.all(
        actores.map((actor) => actor.intentar(ListarRecetasPopulares.ahora())),
      );
      const duracionTotal = Date.now() - inicio;

      // Assert — Ninguna petición falló y tiempo total aceptable
      respuestas.forEach((respuesta) => {
        Afirmar.que(LaRespuesta.statusDe(respuesta)).esIgualA(200);
        Afirmar.que(LaRespuesta.cuerpoDe(respuesta)).esUnArreglo();
      });
      Afirmar.que(duracionTotal).esMenorQue(LIMITE_MS);

      console.log(
        `[Rendimiento] ${CANTIDAD} peticiones concurrentes a top-liked completadas en ${duracionTotal}ms`,
      );
    });
  });
});
