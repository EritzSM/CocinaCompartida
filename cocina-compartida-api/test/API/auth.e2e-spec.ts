import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from '../../src/app.module';

describe('Auth API (e2e) - Patron AAA', () => {
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

  const timestamp = Date.now();
  const uniqueUser = {
    username: `authuser_${timestamp}`,
    email: `authuser_${timestamp}@test.com`,
    password: 'Password123!',
  };

  it('/users (POST) - Debe crear un nuevo usuario', async () => {
    // Arrange (Preparar)
    const payload = {
      username: uniqueUser.username,
      email: uniqueUser.email,
      password: uniqueUser.password,
    };

    // Act (Actuar)
    const response = await request(app.getHttpServer())
      .post('/users')
      .send(payload);

    // Assert (Afirmar)
    expect(response.status).toBe(201);
    expect(response.body.username).toEqual(payload.username);
    expect(response.body.email).toEqual(payload.email);
  });

  it('/auth/login (POST) - Debe retornar un JWT válido', async () => {
    // Arrange (Preparar)
    const loginPayload = {
      email: uniqueUser.email,
      password: uniqueUser.password,
    };

    // Act (Actuar)
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginPayload);

    // Assert (Afirmar)
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
    expect(typeof response.body.token).toBe('string');
  });
});
