import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

import { Actor } from '../screenplay/actor/Actor';
import { ConsumeApi } from '../screenplay/abilities/ConsumeApi';
import { RegistrarCuenta } from '../screenplay/tasks/auth/RegistrarCuenta';
import { IniciarSesion } from '../screenplay/tasks/auth/IniciarSesion';
import { LaRespuesta } from '../screenplay/questions/LaRespuesta';
import { Afirmar } from '../screenplay/fluent/Afirmar';

describe('Regresión: Auth — Login & Registro (e2e)', () => {
  let app: INestApplication;

  const timestamp = Date.now();
  const datosUsuario = {
    username: `reguser_${timestamp}`,
    email: `reguser_${timestamp}@test.com`,
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

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 1: API & Contrato — Registro
  // ═══════════════════════════════════════════════════════════════════════════
  describe('API & Contrato — Registro', () => {

    it('Dado un usuario nuevo, cuando se registra con datos válidos, entonces recibe 201 con username y email', async () => {
      // Arrange
      const usuario = Actor.llamado('NuevoUsuario').con(ConsumeApi.usando(app));

      // Act
      const respuesta = await usuario.intentar(RegistrarCuenta.con(datosUsuario));

      // Assert — Validación del contrato de respuesta
      Afirmar.que(LaRespuesta.statusDe(respuesta)).esIgualA(201);
      Afirmar.que(LaRespuesta.cuerpoDe(respuesta)).tienePropiedad('username');
      Afirmar.que(LaRespuesta.cuerpoDe(respuesta)).tienePropiedad('email');
      Afirmar.que(LaRespuesta.cuerpoDe(respuesta).username).esIgualA(datosUsuario.username);
      Afirmar.que(LaRespuesta.cuerpoDe(respuesta).email).esIgualA(datosUsuario.email);
      // El password nunca debe exponerse en la respuesta
      Afirmar.que(LaRespuesta.cuerpoDe(respuesta)).noTienePropiedad('password');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 2: API & Contrato — Login
  // ═══════════════════════════════════════════════════════════════════════════
  describe('API & Contrato — Login', () => {

    it('Dado un usuario registrado, cuando inicia sesión con credenciales correctas, entonces recibe 201 con success y token', async () => {
      // Arrange
      const usuario = Actor.llamado('UsuarioRegistrado').con(ConsumeApi.usando(app));

      // Act
      const respuesta = await usuario.intentar(
        IniciarSesion.con({ email: datosUsuario.email, password: datosUsuario.password }),
      );

      // Assert — Contrato: { success: true, token: string }
      Afirmar.que(LaRespuesta.statusDe(respuesta)).esIgualA(201);
      Afirmar.que(LaRespuesta.cuerpoDe(respuesta)).tienePropiedad('success');
      Afirmar.que(LaRespuesta.cuerpoDe(respuesta).success).esIgualA(true);
      Afirmar.que(LaRespuesta.cuerpoDe(respuesta)).tienePropiedad('token');
      Afirmar.que(LaRespuesta.tokenDe(respuesta)).esCadena();
    });

    it('Dado un email inexistente, cuando intenta login, entonces recibe 404', async () => {
      // Arrange
      const intruso = Actor.llamado('Intruso').con(ConsumeApi.usando(app));

      // Act
      const respuesta = await intruso.intentar(
        IniciarSesion.con({ email: 'noexiste@fake.com', password: 'cualquiera' }),
      );

      // Assert
      Afirmar.que(LaRespuesta.statusDe(respuesta)).esIgualA(404);
    });

    it('Dado un usuario registrado, cuando inicia sesión con contraseña incorrecta, entonces recibe 404', async () => {
      // Arrange
      const usuario = Actor.llamado('UsuarioPassMal').con(ConsumeApi.usando(app));

      // Act
      const respuesta = await usuario.intentar(
        IniciarSesion.con({ email: datosUsuario.email, password: 'PasswordIncorrecto999!' }),
      );

      // Assert
      Afirmar.que(LaRespuesta.statusDe(respuesta)).esIgualA(404);
    });

    it('Dado un request sin email ni password, cuando intenta login, entonces recibe 400 Bad Request', async () => {
      // Arrange
      const usuario = Actor.llamado('RequestVacio').con(ConsumeApi.usando(app));

      // Act
      const respuesta = await usuario.intentar(
        IniciarSesion.con({ email: '', password: '' }),
      );

      // Assert
      Afirmar.que(LaRespuesta.statusDe(respuesta)).esIgualA(400);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 3: Seguridad — Validación del JWT
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Seguridad — Validación del JWT devuelto', () => {

    it('Dado un login exitoso, el token JWT devuelto debe contener 3 segmentos separados por punto', async () => {
      // Arrange
      const usuario = Actor.llamado('ValidadorJWT').con(ConsumeApi.usando(app));

      // Act
      const respuesta = await usuario.intentar(
        IniciarSesion.con({ email: datosUsuario.email, password: datosUsuario.password }),
      );

      // Assert — Estructura JWT: header.payload.signature
      const token = LaRespuesta.tokenDe(respuesta);
      Afirmar.que(typeof token).esIgualA('string');
      const segmentos = token.split('.');
      Afirmar.que(segmentos.length).esIgualA(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 4: Rendimiento — Latencia del Login
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Rendimiento — Latencia del Login', () => {

    it('Dado el sistema bajo carga normal, el login debe responder en menos de 200ms', async () => {
      // Arrange
      const usuario = Actor.llamado('MedidorRendimiento').con(ConsumeApi.usando(app));
      const LIMITE_MS = 200;

      // Act
      const respuesta = await usuario.intentar(
        IniciarSesion.con({ email: datosUsuario.email, password: datosUsuario.password }),
      );

      // Assert
      Afirmar.que(LaRespuesta.statusDe(respuesta)).esIgualA(201);
      Afirmar.que(LaRespuesta.duracionDe(respuesta)).esMenorQue(LIMITE_MS);

      console.log(
        `[Rendimiento] POST /auth/login completado en ${LaRespuesta.duracionDe(respuesta)}ms`,
      );
    });
  });
});
