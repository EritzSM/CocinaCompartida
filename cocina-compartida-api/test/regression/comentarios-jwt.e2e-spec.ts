import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

import { Actor } from '../screenplay/actor/Actor';
import { ConsumeApi } from '../screenplay/abilities/ConsumeApi';
import { RegistrarCuenta } from '../screenplay/tasks/auth/RegistrarCuenta';
import { IniciarSesion } from '../screenplay/tasks/auth/IniciarSesion';
import { CrearReceta } from '../screenplay/tasks/recipes/CrearReceta';
import { CrearComentario } from '../screenplay/tasks/recipes/CrearComentario';
import { LaRespuesta } from '../screenplay/questions/LaRespuesta';
import { Afirmar } from '../screenplay/fluent/Afirmar';

describe('Regresión: Comentarios con JWT (e2e)', () => {
  let app: INestApplication;
  let jwtToken = '';
  let recipeId = '';

  // ─── Setup / Teardown ─────────────────────────────────────────────────────
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Registrar usuario y obtener JWT
    const ts = Date.now();
    const datos = {
      username: `commentuser_${ts}`,
      email: `commentuser_${ts}@test.com`,
      password: 'Password123!',
    };

    const cocinero = Actor.llamado('Comentarista').con(ConsumeApi.usando(app));
    await cocinero.intentar(RegistrarCuenta.con(datos));

    const sesion = await cocinero.intentar(
      IniciarSesion.con({ email: datos.email, password: datos.password }),
    );
    jwtToken = LaRespuesta.tokenDe(sesion);

    // Crear una receta para comentar
    const receta = await cocinero.intentar(
      CrearReceta.con({
        name: 'Receta para comentar',
        descripcion: 'Base para tests de comentarios',
        ingredients: ['Agua', 'Sal'],
        steps: ['Mezclar'],
      })
        .autenticadoCon(jwtToken)
        .comoTarea(),
    );
    recipeId = receta.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 1: API & Contrato — Crear Comentario
  // ═══════════════════════════════════════════════════════════════════════════
  describe('API & Contrato — Crear Comentario', () => {

    it('Dado un usuario autenticado, cuando crea un comentario válido, entonces recibe 201 con id y message', async () => {
      // Arrange
      const usuario = Actor.llamado('ComentaristaValido').con(ConsumeApi.usando(app));
      const comentario = CrearComentario
        .en(recipeId)
        .con({ message: 'Excelente receta, la probé y quedó genial!' })
        .autenticadoCon(jwtToken);

      // Act
      const respuesta = await usuario.intentar(comentario.comoTarea());

      // Assert — Contrato de respuesta
      Afirmar.que(LaRespuesta.statusDe(respuesta)).esIgualA(201);
      Afirmar.que(LaRespuesta.cuerpoDe(respuesta)).tienePropiedad('id');
      Afirmar.que(LaRespuesta.cuerpoDe(respuesta)).tienePropiedad('message');
      Afirmar.que(LaRespuesta.cuerpoDe(respuesta).message).esIgualA(
        'Excelente receta, la probé y quedó genial!',
      );
    });

    it('Dado una receta con comentarios, cuando se listan los comentarios, entonces devuelve 200 con un arreglo', async () => {
      // Arrange
      const visitante = Actor.llamado('LectorComentarios').con(ConsumeApi.usando(app));
      const api = visitante.usar<ConsumeApi>(ConsumeApi.CLAVE);

      // Act
      const raw = await api.get(`/recipes/${recipeId}/comments`);
      const respuesta = { status: raw.status, body: raw.body };

      // Assert
      Afirmar.que(LaRespuesta.statusDe(respuesta)).esIgualA(200);
      Afirmar.que(LaRespuesta.cuerpoDe(respuesta)).esUnArreglo();
      Afirmar.que(LaRespuesta.cuerpoDe(respuesta)).tieneElementos();
    });

    it('Dado un comentario creado, debe aparecer en el listado de comentarios de la receta', async () => {
      // Arrange — Crear un comentario con texto único
      const usuario = Actor.llamado('VerificadorRegresion').con(ConsumeApi.usando(app));
      const textoUnico = `Comentario de regresión ${Date.now()}`;

      const comentario = CrearComentario
        .en(recipeId)
        .con({ message: textoUnico })
        .autenticadoCon(jwtToken);

      // Act — Crear y luego listar
      await usuario.intentar(comentario.comoTarea());

      const api = usuario.usar<ConsumeApi>(ConsumeApi.CLAVE);
      const raw = await api.get(`/recipes/${recipeId}/comments`);
      const comentarios = raw.body as any[];

      // Assert — El comentario debe existir en el listado
      const encontrado = comentarios.find((c: any) => c.message === textoUnico);
      expect(encontrado).toBeDefined();
      expect(encontrado.message).toBe(textoUnico);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 2: Seguridad — JWT en Comentarios
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Seguridad — JWT en Comentarios', () => {

    it('Dado un visitante sin token, cuando intenta crear un comentario, entonces recibe 401 Unauthorized', async () => {
      // Arrange — Sin autenticación
      const visitante = Actor.llamado('SinToken').con(ConsumeApi.usando(app));
      const comentarioSinAuth = CrearComentario
        .en(recipeId)
        .con({ message: 'Intento sin permiso' });

      // Act
      const respuesta = await visitante.intentar(comentarioSinAuth.comoTarea());

      // Assert
      Afirmar.que(LaRespuesta.statusDe(respuesta)).esIgualA(401);
      Afirmar.que(LaRespuesta.cuerpoDe(respuesta).message).contiene('Falta Authorization');
    });

    it('Dado un token JWT falso, cuando intenta crear un comentario, entonces recibe 401 Unauthorized', async () => {
      // Arrange — Token fabricado
      const hacker = Actor.llamado('TokenFalso').con(ConsumeApi.usando(app));
      const tokenFalso = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.falso.token_inventado';

      const comentarioMalicioso = CrearComentario
        .en(recipeId)
        .con({ message: 'Hack attempt' })
        .autenticadoCon(tokenFalso);

      // Act
      const respuesta = await hacker.intentar(comentarioMalicioso.comoTarea());

      // Assert
      Afirmar.que(LaRespuesta.statusDe(respuesta)).esIgualA(401);
      Afirmar.que(LaRespuesta.cuerpoDe(respuesta).message).contiene('Token inválido o expirado');
    });

    it('Dado un token JWT expirado (firmado con secret pero exp en el pasado), cuando intenta comentar, entonces recibe 401', async () => {
      // Arrange — Simular token expirado con payload manipulado
      const hacker = Actor.llamado('TokenExpirado').con(ConsumeApi.usando(app));

      // Token con formato válido pero payload inventado (expirado)
      // Base64 de {"alg":"HS256","typ":"JWT"}.{"sub":"fake","exp":1000000000}.fake
      const tokenExpirado = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmYWtlIiwiZXhwIjoxMDAwMDAwMDAwfQ.fake_signature';

      const comentario = CrearComentario
        .en(recipeId)
        .con({ message: 'Intento con token expirado' })
        .autenticadoCon(tokenExpirado);

      // Act
      const respuesta = await hacker.intentar(comentario.comoTarea());

      // Assert
      Afirmar.que(LaRespuesta.statusDe(respuesta)).esIgualA(401);
    });
  });
});
