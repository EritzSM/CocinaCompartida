import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from './../../src/app.module';

describe('Security Checks (e2e) - Patron AAA', () => {
  let app: INestApplication;
  let hackerToken = '';
  let standardUserToken = '';
  let victimRecipeId = '';
  let victimUser: any;

  beforeAll(async () => {
    // Setup general
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // NestJS default ValidationPipe must be active if they set it up in main.ts
    // but e2e tests skip main.ts. Usually projects add app.useGlobalPipes() here. 
    // We assume the global app handles it or we're just testing the guard logic.
    await app.init();

    // 1. Crear el usuario "Víctima"
    victimUser = {
      username: `victim_${Date.now()}`,
      email: `victim_${Date.now()}@test.com`,
      password: 'Password123!',
    };
    await request(app.getHttpServer()).post('/users').send(victimUser);
    const victimLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: victimUser.email, password: victimUser.password });
    standardUserToken = victimLogin.body.token;

    // La víctima crea una receta
    const recipeRes = await request(app.getHttpServer())
      .post('/recipes')
      .set('Authorization', `Bearer ${standardUserToken}`)
      .send({
        name: 'Receta de la Víctima',
        descripcion: 'Privada',
        ingredients: ['Agua'],
        steps: ['Hervir'],
      });
    victimRecipeId = recipeRes.body.id;

    // 2. Crear el usuario "Hacker"
    const hackerUser = {
      username: `hacker_${Date.now()}`,
      email: `hacker_${Date.now()}@test.com`,
      password: 'Password123!',
    };
    await request(app.getHttpServer()).post('/users').send(hackerUser);
    const hackerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: hackerUser.email, password: hackerUser.password });
    hackerToken = hackerLogin.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Autenticación y Tokens (JWT)', () => {
    it('Debe rechazar un Token JWT falso o malformado (401)', async () => {
      // Arrange (Preparar)
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.falso.token_inventado';
      const targetEndpoint = '/recipes';

      // Act (Actuar)
      const response = await request(app.getHttpServer())
        .post(targetEndpoint)
        .set('Authorization', `Bearer ${fakeToken}`)
        .send({ name: 'Hack', descripcion: 'Tratando de infiltrar' });

      // Assert (Afirmar)
      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Token inválido o expirado'); 
      // Tu AuthGuard actual lanza "Falta Authorization" si falla el jwt.verify
    });
  });

  describe('Control de Acceso basado en Propiedad (IDOR / RecipeOwnerGuard)', () => {
    it('Un usuario no puede eliminar la receta de otro usuario (403 Forbidden)', async () => {
      // Arrange (Preparar)
      const targetEndpoint = `/recipes/${victimRecipeId}`;
      const attackerToken = hackerToken; // El hacker usará su propio token válido

      // Act (Actuar)
      const response = await request(app.getHttpServer())
        .delete(targetEndpoint)
        .set('Authorization', `Bearer ${attackerToken}`);

      // Assert (Afirmar)
      expect(response.status).toBe(403);
      // El decorador de NestJS ForbiddenException devuelve Forbidden
      expect(response.body.message).toContain('Solo el dueño puede realizar esta acción');
    });

    it('Un usuario no puede editar la receta de otro usuario (403 Forbidden)', async () => {
      // Arrange (Preparar)
      const targetEndpoint = `/recipes/${victimRecipeId}`;
      const attackerToken = hackerToken;
      const maliciousPayload = { name: 'Receta Hackeada' };

      // Act (Actuar)
      const response = await request(app.getHttpServer())
        .patch(targetEndpoint)
        .set('Authorization', `Bearer ${attackerToken}`)
        .send(maliciousPayload);

      // Assert (Afirmar)
      expect(response.status).toBe(403);
    });
  });

});
