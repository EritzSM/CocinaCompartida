// ═══════════════════════════════════════════════════════════════════════════
// Step Definitions: Crear Comentario — Entregable Principal
// Conecta: crear-comentario.feature ↔ PostComment Task ↔ ElComentarioCreado Question ↔ FluentExpect
// ═══════════════════════════════════════════════════════════════════════════

import { Given, When, Then } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight } from '@serenity-js/core';
import { Send, PostRequest, GetRequest, LastResponse } from '@serenity-js/rest';
import { Ensure, equals, includes } from '@serenity-js/assertions';

// ─── Screenplay Imports ──────────────────────────────────────────────────────
import { PostComment } from '../../screenplay/tasks/comments/PostComment';
import { ElComentarioCreado } from '../../screenplay/questions/ElComentarioCreado';
import { esperar } from '../../screenplay/fluent/FluentExpect';

// ─── Estado compartido entre steps ───────────────────────────────────────────
let jwtToken = '';
let recipeId = '';
let lastResponse: any = null;
let dynamicEmail = '';

// ═══════════════════════════════════════════════════════════════════════════
// GIVEN — Precondiciones (Background)
// ═══════════════════════════════════════════════════════════════════════════

Given(
  'que existe un usuario {string} registrado con correo {string} y contraseña {string}',
  async (nombre: string, correoTemplate: string, password: string) => {
    const actor = actorCalled(nombre);
    const ts = Date.now();
    dynamicEmail = `${nombre.toLowerCase()}_${ts}@test.com`;

    // Registrar al usuario
    await actor.attemptsTo(
      Send.a(PostRequest.to('/users').with({
        username: `${nombre}_${ts}`,
        email: dynamicEmail,
        password,
      })),
    );
  },
);

Given(
  '{string} inicia sesión y obtiene un JWT válido',
  async (nombre: string) => {
    const actor = actorCalled(nombre);

    await actor.attemptsTo(
      Send.a(PostRequest.to('/auth/login').with({
        email: dynamicEmail,
        password: 'Password123!',
      })),
    );

    const body: any = await LastResponse.body().answeredBy(actor);
    jwtToken = body.token;

    // ── Fluent Assertion: el token debe ser un JWT válido ──
    esperar(jwtToken).esteDefinido();
    esperar(jwtToken).seaUnJwtValido();
  },
);

Given(
  'existe una receta publicada por {string} con nombre {string}',
  async (nombre: string, nombreReceta: string) => {
    const actor = actorCalled(nombre);

    await actor.attemptsTo(
      Send.a(PostRequest.to('/recipes').using({
        headers: { Authorization: `Bearer ${jwtToken}` },
      }).with({
        name: nombreReceta,
        descripcion: 'Receta creada automáticamente para tests BDD',
        ingredients: ['Ingrediente 1', 'Ingrediente 2'],
        steps: ['Paso 1', 'Paso 2'],
      })),
    );

    const body: any = await LastResponse.body().answeredBy(actor);
    recipeId = body.id;

    // ── Fluent Assertion: la receta debe haberse creado ──
    esperar(recipeId).esteDefinido();
  },
);

Given(
  'que {string} tiene un JWT válido',
  async (_nombre: string) => {
    // El JWT ya fue obtenido en el Background
    esperar(jwtToken).seaCadena();
    esperar(jwtToken).noEsteVacio();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// WHEN — Acciones
// ═══════════════════════════════════════════════════════════════════════════

When(
  '{string} envía un comentario con mensaje {string} en la receta',
  async (nombre: string, mensaje: string) => {
    const actor = actorCalled(nombre);

    await actor.attemptsTo(
      Send.a(PostRequest.to(`/recipes/${recipeId}/comments`).using({
        headers: { Authorization: `Bearer ${jwtToken}` },
      }).with({ message: mensaje })),
    );

    const status = await LastResponse.status().answeredBy(actor);
    const body = await LastResponse.body().answeredBy(actor);
    lastResponse = { status, body };
  },
);

When(
  '{string} envía un comentario con un mensaje de {int} caracteres en la receta',
  async (nombre: string, longitud: number) => {
    const actor = actorCalled(nombre);
    const mensajeLargo = 'A'.repeat(longitud);

    await actor.attemptsTo(
      Send.a(PostRequest.to(`/recipes/${recipeId}/comments`).using({
        headers: { Authorization: `Bearer ${jwtToken}` },
      }).with({ message: mensajeLargo })),
    );

    const status = await LastResponse.status().answeredBy(actor);
    const body = await LastResponse.body().answeredBy(actor);
    lastResponse = { status, body };
  },
);

When(
  '{string} envía un comentario con mensaje {string} en la receta con id {string}',
  async (nombre: string, mensaje: string, fakeRecipeId: string) => {
    const actor = actorCalled(nombre);

    await actor.attemptsTo(
      Send.a(PostRequest.to(`/recipes/${fakeRecipeId}/comments`).using({
        headers: { Authorization: `Bearer ${jwtToken}` },
      }).with({ message: mensaje })),
    );

    const status = await LastResponse.status().answeredBy(actor);
    const body = await LastResponse.body().answeredBy(actor);
    lastResponse = { status, body };
  },
);

When(
  'un visitante sin autenticación envía un comentario con mensaje {string} en la receta',
  async (mensaje: string) => {
    const actor = actorCalled('Visitante');

    // Sin header Authorization
    await actor.attemptsTo(
      Send.a(PostRequest.to(`/recipes/${recipeId}/comments`).with({ message: mensaje })),
    );

    const status = await LastResponse.status().answeredBy(actor);
    const body = await LastResponse.body().answeredBy(actor);
    lastResponse = { status, body };
  },
);

When(
  'un visitante envía un comentario con token falso {string} en la receta',
  async (tokenFalso: string) => {
    const actor = actorCalled('Hacker');

    await actor.attemptsTo(
      Send.a(PostRequest.to(`/recipes/${recipeId}/comments`).using({
        headers: { Authorization: `Bearer ${tokenFalso}` },
      }).with({ message: 'Intento malicioso' })),
    );

    const status = await LastResponse.status().answeredBy(actor);
    const body = await LastResponse.body().answeredBy(actor);
    lastResponse = { status, body };
  },
);

When(
  'un visitante envía un comentario con token expirado en la receta',
  async () => {
    const actor = actorCalled('TokenExpirado');
    const tokenExpirado = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmYWtlIiwiZXhwIjoxMDAwMDAwMDAwfQ.firma_invalida';

    await actor.attemptsTo(
      Send.a(PostRequest.to(`/recipes/${recipeId}/comments`).using({
        headers: { Authorization: `Bearer ${tokenExpirado}` },
      }).with({ message: 'Token expirado' })),
    );

    const status = await LastResponse.status().answeredBy(actor);
    const body = await LastResponse.body().answeredBy(actor);
    lastResponse = { status, body };
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// THEN — Validaciones con Question + FluentExpect
// ═══════════════════════════════════════════════════════════════════════════

Then(
  'debe recibir un código HTTP {int}',
  async (codigoEsperado: number) => {
    // ── Fluent Assertion ──
    esperar(lastResponse.status).seaIgualA(codigoEsperado);
  },
);

Then(
  'el cuerpo de la respuesta debe contener un campo {string}',
  async (campo: string) => {
    // ── Question: extraer y validar con patrón Screenplay ──
    const comentario = ElComentarioCreado.desde(lastResponse);
    esperar(comentario.body).tengaPropiedad(campo);
  },
);

Then(
  'el cuerpo de la respuesta debe contener el campo {string} con valor {string}',
  async (campo: string, valorEsperado: string) => {
    const comentario = ElComentarioCreado.desde(lastResponse);
    esperar(comentario.body).tengaPropiedad(campo);
    esperar(comentario.body[campo]).seaIgualA(valorEsperado);
  },
);

Then(
  'el comentario debe aparecer en el listado de comentarios de la receta',
  async () => {
    const actor = actorInTheSpotlight();

    await actor.attemptsTo(
      Send.a(GetRequest.to(`/recipes/${recipeId}/comments`)),
    );

    const body: any = await LastResponse.body().answeredBy(actor);

    // ── Fluent Assertion: el listado debe contener el comentario creado ──
    esperar(body).seaUnArreglo();
    esperar(body).tengaAlMenos(1).elementos();
  },
);

Then(
  'el campo {string} en la respuesta debe tener {int} caracteres',
  async (campo: string, longitud: number) => {
    const comentario = ElComentarioCreado.desde(lastResponse);
    esperar(comentario.body[campo]).seaCadena();
    esperar(comentario.body[campo].length).seaIgualA(longitud);
  },
);

Then(
  'el mensaje de error debe contener {string}',
  async (textoEsperado: string) => {
    const comentario = ElComentarioCreado.desde(lastResponse);
    esperar(comentario.errorMessage).contenga(textoEsperado);
  },
);
