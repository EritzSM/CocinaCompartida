import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../../src/app.module';

import { Actor } from '../screenplay/actor/Actor';
import { ConsumeApi } from '../screenplay/abilities/ConsumeApi';
import { RegistrarCuenta } from '../screenplay/tasks/auth/RegistrarCuenta';
import { IniciarSesion } from '../screenplay/tasks/auth/IniciarSesion';
import { CrearReceta } from '../screenplay/tasks/recipes/CrearReceta';
import { LaRespuesta } from '../screenplay/questions/LaRespuesta';
import { Afirmar } from '../screenplay/fluent/Afirmar';

describe('Security Checks (e2e) — Patrón Screenplay', () => {
  let app: INestApplication;
  let hackerToken = '';
  let tokenVictima = '';
  let idRecetaVictima = '';

  // ─── Setup / Teardown ─────────────────────────────────────────────────────
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const ts = Date.now();

    // Actor "Víctima": se registra, inicia sesión y crea una receta
    const victima = Actor.llamado('Victima').con(ConsumeApi.usando(app));
    const datosVictima = {
      username: `victim_${ts}`,
      email: `victim_${ts}@test.com`,
      password: 'Password123!',
    };
    await victima.intentar(RegistrarCuenta.con(datosVictima));
    const sesionVictima = await victima.intentar(
      IniciarSesion.con({ email: datosVictima.email, password: datosVictima.password }),
    );
    tokenVictima = LaRespuesta.tokenDe(sesionVictima);

    const receta = await victima.intentar(
      CrearReceta.con({
        name: 'Receta de la Víctima',
        descripcion: 'Privada',
        ingredients: ['Agua'],
        steps: ['Hervir'],
      })
        .autenticadoCon(tokenVictima)
        .comoTarea(),
    );
    idRecetaVictima = receta.body.id;

    // Actor "Hacker": se registra e inicia sesión para obtener su propio token
    const hacker = Actor.llamado('Hacker').con(ConsumeApi.usando(app));
    const datosHacker = {
      username: `hacker_${ts}`,
      email: `hacker_${ts}@test.com`,
      password: 'Password123!',
    };
    await hacker.intentar(RegistrarCuenta.con(datosHacker));
    const sesionHacker = await hacker.intentar(
      IniciarSesion.con({ email: datosHacker.email, password: datosHacker.password }),
    );
    hackerToken = LaRespuesta.tokenDe(sesionHacker);
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Autenticación y Tokens (JWT) ─────────────────────────────────────────
  describe('Autenticación y Tokens (JWT)', () => {

    it('Dado un token JWT falso, cuando el hacker intenta crear una receta, entonces debe ser rechazado con 401', async () => {
      // Arrange — Actor Hacker con un token fabricado
      const hacker = Actor.llamado('Hacker').con(ConsumeApi.usando(app));
      const tokenFalso = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.falso.token_inventado';
      const recetaMaliciosa = CrearReceta.con({
        name: 'Hack',
        descripcion: 'Tratando de infiltrar',
        ingredients: [],
        steps: [],
      }).autenticadoCon(tokenFalso);

      // Act — El hacker intenta crear con token inválido
      const respuesta = await hacker.intentar(recetaMaliciosa.comoTarea());

      // Assert — Debe ser rechazado
      Afirmar.que(LaRespuesta.statusDe(respuesta)).esIgualA(401);
      Afirmar.que(LaRespuesta.cuerpoDe(respuesta).message).contiene('Token inválido o expirado');
    });
  });

  // ─── Control de Acceso basado en Propiedad (IDOR / RecipeOwnerGuard) ──────
  describe('Control de Acceso basado en Propiedad (IDOR / RecipeOwnerGuard)', () => {

    it('Dado un hacker con token válido propio, cuando intenta eliminar la receta de otro, entonces debe recibir 403 Forbidden', async () => {
      // Arrange — Hacker con su token real pero apuntando a la receta ajena
      const hacker = Actor.llamado('Hacker').con(ConsumeApi.usando(app));
      const api = hacker.usar<ConsumeApi>(ConsumeApi.CLAVE);

      // Act — Intento de DELETE sobre la receta de la víctima
      const raw = await api
        .delete(`/recipes/${idRecetaVictima}`)
        .set('Authorization', `Bearer ${hackerToken}`);
      const respuesta = { status: raw.status, body: raw.body };

      // Assert
      Afirmar.que(LaRespuesta.statusDe(respuesta)).esIgualA(403);
      Afirmar.que(LaRespuesta.cuerpoDe(respuesta).message).contiene('Solo el dueño puede realizar esta acción');
    });

    it('Dado un hacker con token válido propio, cuando intenta editar la receta de otro, entonces debe recibir 403 Forbidden', async () => {
      // Arrange — Hacker con su token real pero apuntando a la receta ajena
      const hacker = Actor.llamado('Hacker').con(ConsumeApi.usando(app));
      const api = hacker.usar<ConsumeApi>(ConsumeApi.CLAVE);

      // Act — Intento de PATCH sobre la receta de la víctima
      const raw = await api
        .patch(`/recipes/${idRecetaVictima}`)
        .set('Authorization', `Bearer ${hackerToken}`)
        .send({ name: 'Receta Hackeada' });
      const respuesta = { status: raw.status, body: raw.body };

      // Assert
      Afirmar.que(LaRespuesta.statusDe(respuesta)).esIgualA(403);
    });
  });
});
