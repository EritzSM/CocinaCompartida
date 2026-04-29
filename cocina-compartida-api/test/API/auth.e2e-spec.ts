import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

import { Actor } from '../screenplay/actor/Actor';
import { ConsumeApi } from '../screenplay/abilities/ConsumeApi';
import { RegistrarCuenta } from '../screenplay/tasks/auth/RegistrarCuenta';
import { IniciarSesion } from '../screenplay/tasks/auth/IniciarSesion';
import { LaRespuesta } from '../screenplay/questions/LaRespuesta';
import { Afirmar } from '../screenplay/fluent/Afirmar';

describe('Auth API (e2e) — Patrón Screenplay', () => {
  let app: INestApplication;

  // ─── Datos de contexto compartidos entre escenarios ───────────────────────
  const timestamp = Date.now();
  const datosUsuario = {
    username: `authuser_${timestamp}`,
    email: `authuser_${timestamp}@test.com`,
    password: 'Password123!',
  };

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

  // ─── Escenario 1: Registro de nueva cuenta ────────────────────────────────
  it('Dado un usuario nuevo, cuando se registra, entonces debe crearse con status 201', async () => {
    // Arrange — Actor con habilidad de consumir la API
    const usuario = Actor.llamado('NuevoUsuario').con(ConsumeApi.usando(app));

    // Act — El actor intenta registrar su cuenta
    const respuesta = await usuario.intentar(RegistrarCuenta.con(datosUsuario));

    // Assert — Fluent assertions sobre la respuesta
    Afirmar.que(LaRespuesta.statusDe(respuesta)).esIgualA(201);
    Afirmar.que(LaRespuesta.cuerpoDe(respuesta)).tienePropiedad('username');
    Afirmar.que(LaRespuesta.cuerpoDe(respuesta).username).esIgualA(datosUsuario.username);
    Afirmar.que(LaRespuesta.cuerpoDe(respuesta).email).esIgualA(datosUsuario.email);
  });

  // ─── Escenario 2: Login y obtención de JWT ────────────────────────────────
  it('Dado un usuario registrado, cuando inicia sesión, entonces debe recibir un JWT válido', async () => {
    // Arrange — Actor con credenciales del usuario ya registrado
    const usuario = Actor.llamado('UsuarioRegistrado').con(ConsumeApi.usando(app));

    // Act — El actor intenta iniciar sesión
    const respuesta = await usuario.intentar(
      IniciarSesion.con({
        email: datosUsuario.email,
        password: datosUsuario.password,
      }),
    );

    // Assert — El token debe estar presente y ser un string
    Afirmar.que(LaRespuesta.statusDe(respuesta)).esIgualA(201);
    Afirmar.que(LaRespuesta.cuerpoDe(respuesta)).tienePropiedad('token');
    Afirmar.que(LaRespuesta.tokenDe(respuesta)).esCadena();
  });
});
