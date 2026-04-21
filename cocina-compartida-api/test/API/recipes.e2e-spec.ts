import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from '../../src/app.module';

describe('Recipes API (e2e) - Patron AAA', () => {
  let app: INestApplication;
  let jwtToken = '';

  beforeAll(async () => {
    // Setup general
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Creación de usuario y obtención del JWT en memoria global
    const timestamp = Date.now();
    const uniqueUser = {
      username: `recipeuser_${timestamp}`,
      email: `recipeuser_${timestamp}@test.com`,
      password: 'Password123!',
    };

    await request(app.getHttpServer()).post('/users').send(uniqueUser);
    
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: uniqueUser.email, password: uniqueUser.password });
    
    jwtToken = loginRes.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Flujo Protegido de Creación', () => {
    
    it('/recipes (POST) - Rechaza si no se envía un JWT (401)', async () => {
      // Arrange (Preparar)
      const invalidRecipePayload = {
        name: 'Receta Bloqueada',
        descripcion: 'Intento malicioso',
        ingredients: ['Nada'],
        steps: ['Llorar']
      };

      // Act (Actuar)
      const response = await request(app.getHttpServer())
        .post('/recipes')
        .send(invalidRecipePayload);
      
      // Assert (Afirmar)
      expect(response.status).toBe(401);
      // Validamos que el cuerpo traiga la firma oficial de NestJS para este error
      expect(response.body.message).toContain('Falta Authorization');
    });

    it('/recipes (POST) - Crea la receta con JWT válido (201)', async () => {
      // Arrange (Preparar)
      const validRecipePayload = {
        name: 'Receta AAA E2E',
        descripcion: 'Prueba automática de API (Manejo Completo)',
        ingredients: ['Agua', 'Verduras'],
        steps: ['Hervir'],
        category: 'entradas' // Usando la categoría que reparamos recientemente
      };
      
      // Act (Actuar)
      const response = await request(app.getHttpServer())
        .post('/recipes')
        .set('Authorization', `Bearer ${jwtToken}`) // Header de seguridad
        .send(validRecipePayload);

      // Assert (Afirmar)
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(validRecipePayload.name);
      expect(response.body.category).toBe(validRecipePayload.category);
    });
  });

  describe('Flujo Público (CRUD)', () => {
    
    it('/recipes (GET) - Retorna la lista de recetas', async () => {
      // Arrange (Preparar)
      const targetEndpoint = '/recipes';

      // Act (Actuar)
      const response = await request(app.getHttpServer())
        .get(targetEndpoint);

      // Assert (Afirmar)
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
    });

  });
});
