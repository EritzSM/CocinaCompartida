import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

import { Actor } from '../screenplay/actor/Actor';
import { ConsumeApi } from '../screenplay/abilities/ConsumeApi';
import { RegistrarCuenta } from '../screenplay/tasks/auth/RegistrarCuenta';
import { IniciarSesion } from '../screenplay/tasks/auth/IniciarSesion';
import { CrearReceta } from '../screenplay/tasks/recipes/CrearReceta';
import { ListarRecetas } from '../screenplay/tasks/recipes/ListarRecetas';
import { LaRespuesta } from '../screenplay/questions/LaRespuesta';
import { Afirmar } from '../screenplay/fluent/Afirmar';

describe('Recipes API (e2e) — Patrón Screenplay', () => {
  let app: INestApplication;
  let jwtToken = '';

  // ─── Setup / Teardown ─────────────────────────────────────────────────────
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // El actor "Cocinero" se registra y obtiene su token para los tests protegidos
    const timestamp = Date.now();
    const datosCocinero = {
      username: `recipeuser_${timestamp}`,
      email: `recipeuser_${timestamp}@test.com`,
      password: 'Password123!',
    };

    const cocinero = Actor.llamado('Cocinero').con(ConsumeApi.usando(app));
    await cocinero.intentar(RegistrarCuenta.con(datosCocinero));

    const sesion = await cocinero.intentar(
      IniciarSesion.con({ email: datosCocinero.email, password: datosCocinero.password }),
    );
    jwtToken = LaRespuesta.tokenDe(sesion);
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Flujo Protegido de Creación ──────────────────────────────────────────
  describe('Flujo Protegido de Creación', () => {

    it('Dado un visitante sin token, cuando intenta crear una receta, entonces debe ser rechazado con 401', async () => {
      // Arrange — Visitante sin credenciales
      const visitante = Actor.llamado('Visitante').con(ConsumeApi.usando(app));
      const recetaNoAutorizada = CrearReceta.con({
        name: 'Receta Bloqueada',
        descripcion: 'Intento sin autenticación',
        ingredients: ['Nada'],
        steps: ['Llorar'],
      });

      // Act — El visitante intenta crear la receta sin token
      const respuesta = await visitante.intentar(recetaNoAutorizada.comoTarea());

      // Assert — Debe ser rechazado
      Afirmar.que(LaRespuesta.statusDe(respuesta)).esIgualA(401);
      Afirmar.que(LaRespuesta.cuerpoDe(respuesta).message).contiene('Falta Authorization');
    });

    it('Dado un cocinero autenticado, cuando crea una receta válida, entonces debe crearse con status 201', async () => {
      // Arrange — Cocinero con JWT válido
      const cocinero = Actor.llamado('Cocinero').con(ConsumeApi.usando(app));
      const nuevaReceta = CrearReceta.con({
        name: 'Receta Screenplay E2E',
        descripcion: 'Prueba automática con patrón Screenplay',
        ingredients: ['Agua', 'Verduras'],
        steps: ['Hervir'],
        category: 'entradas',
      }).autenticadoCon(jwtToken);

      // Act — El cocinero crea la receta con su token
      const respuesta = await cocinero.intentar(nuevaReceta.comoTarea());

      // Assert — La receta debe existir con los datos correctos
      Afirmar.que(LaRespuesta.statusDe(respuesta)).esIgualA(201);
      Afirmar.que(LaRespuesta.cuerpoDe(respuesta)).tienePropiedad('id');
      Afirmar.que(LaRespuesta.cuerpoDe(respuesta).name).esIgualA('Receta Screenplay E2E');
      Afirmar.que(LaRespuesta.cuerpoDe(respuesta).category).esIgualA('entradas');
    });
  });

  // ─── Flujo Público (CRUD) ─────────────────────────────────────────────────
  describe('Flujo Público (CRUD)', () => {

    it('Dado cualquier visitante, cuando lista las recetas, entonces debe recibir un arreglo con elementos', async () => {
      // Arrange — Visitante público
      const visitante = Actor.llamado('VisitantePublico').con(ConsumeApi.usando(app));

      // Act — El visitante consulta el listado público
      const respuesta = await visitante.intentar(ListarRecetas.ahora());

      // Assert — Debe devolver un arreglo con al menos una receta
      Afirmar.que(LaRespuesta.statusDe(respuesta)).esIgualA(200);
      Afirmar.que(LaRespuesta.cuerpoDe(respuesta)).esUnArreglo();
      Afirmar.que(LaRespuesta.cuerpoDe(respuesta)).tieneElementos();
    });
  });
});
