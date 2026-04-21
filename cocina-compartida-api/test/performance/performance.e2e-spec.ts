import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from './../../src/app.module';

describe('Performance Checks (e2e) - Patron AAA', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Setup general del entorno
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Tiempos de Respuesta (Response Times)', () => {
    it('Obtener lista de recetas (GET /recipes) debe resolverse bajo un límite de 300ms', async () => {
      // Arrange (Preparar)
      const endpoint = '/recipes';
      const timeLimitMs = 300; // Límite de tiempo esperado
      const startTime = Date.now();

      // Act (Actuar)
      const response = await request(app.getHttpServer()).get(endpoint);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert (Afirmar)
      expect(response.status).toBe(200);
      // Evaluamos el rendimiento (que haya tardado menos que el límite)
      expect(duration).toBeLessThan(timeLimitMs);
      
      // Logs opcionales para dejar trazabilidad del desempeño
      console.log(`[Performance] GET /recipes completado en ${duration}ms`);
    });
  });

  describe('Prueba de Carga Concurrente Leve (Throughput)', () => {
    it('Debe procesar 15 peticiones simultáneas velozmente (bajo 1000ms)', async () => {
      // Arrange (Preparar)
      const endpoint = '/recipes';
      const requestCount = 15;
      
      // Act (Actuar)
      const startTime = Date.now();

      // Generamos y disparamos 15 peticiones en paralelo (Simulando usuarios simultáneos)
      const loadRequests = Array.from({ length: requestCount }).map(() => 
        request(app.getHttpServer()).get(endpoint)
      );
      const responses = await Promise.all(loadRequests);
      
      const duration = Date.now() - startTime;

      // Assert (Afirmar)
      // Confirmar que NINGUNA de las 15 conexiones abortó u obtuvo error
      responses.forEach((res) => {
        expect(res.status).toBe(200);
      });
      // Comprobar que en bloque se respondieron antes de 1 segundo
      expect(duration).toBeLessThan(1000);
      
      console.log(`[Performance] ${requestCount} peticiones concurrentes completadas en ${duration}ms`);
    });
  });
});
