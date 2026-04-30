// ═══════════════════════════════════════════════════════════════════════════
// Step Definitions: Auth — Login y Registro
// Conecta: auth-login-registro.feature ↔ LoginAndRememberToken Task ↔ FluentExpect
// ═══════════════════════════════════════════════════════════════════════════

import { Given, When, Then } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight } from '@serenity-js/core';
import { Send, PostRequest, LastResponse } from '@serenity-js/rest';

import { esperar } from '../../screenplay/fluent/FluentExpect';

// ─── Estado compartido ───────────────────────────────────────────────────────
let lastResponse: any = null;
let dynamicEmail = '';
let startTime = 0;

// ═══════════════════════════════════════════════════════════════════════════
// GIVEN
// ═══════════════════════════════════════════════════════════════════════════

Given(
  'que existe un usuario registrado {string} con correo {string} y contraseña {string}',
  async (nombre: string, correoTemplate: string, password: string) => {
    const actor = actorCalled(nombre);
    const ts = Date.now();
    dynamicEmail = `${nombre.toLowerCase()}_${ts}@test.com`;

    await actor.attemptsTo(
      Send.a(PostRequest.to('/users').with({
        username: `${nombre}_${ts}`,
        email: dynamicEmail,
        password,
      })),
    );
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// WHEN — Login
// ═══════════════════════════════════════════════════════════════════════════

When(
  '{string} envía una solicitud de login con correo {string} y contraseña {string}',
  async (nombre: string, correo: string, password: string) => {
    const actor = actorCalled(nombre);
    // Si el correo del feature coincide con el template, usamos el dinámico
    const emailReal = correo.includes('reg@test.com') ? dynamicEmail : correo;

    startTime = Date.now();
    await actor.attemptsTo(
      Send.a(PostRequest.to('/auth/login').with({ email: emailReal, password })),
    );

    const status = await LastResponse.status().answeredBy(actor);
    const body: any = await LastResponse.body().answeredBy(actor);
    lastResponse = { status, body, duration: Date.now() - startTime };
  },
);

When(
  'un visitante envía login con correo {string} y contraseña {string}',
  async (correo: string, password: string) => {
    const actor = actorCalled('VisitanteAuth');

    startTime = Date.now();
    await actor.attemptsTo(
      Send.a(PostRequest.to('/auth/login').with({ email: correo, password })),
    );

    const status = await LastResponse.status().answeredBy(actor);
    const body: any = await LastResponse.body().answeredBy(actor);
    lastResponse = { status, body, duration: Date.now() - startTime };
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// WHEN — Registro
// ═══════════════════════════════════════════════════════════════════════════

When(
  'un visitante se registra con username {string}, correo {string} y contraseña {string}',
  async (username: string, correoTemplate: string, password: string) => {
    const actor = actorCalled('NuevoVisitante');
    const ts = Date.now();

    await actor.attemptsTo(
      Send.a(PostRequest.to('/users').with({
        username: `${username}_${ts}`,
        email: `${username.toLowerCase()}_${ts}@test.com`,
        password,
      })),
    );

    const status = await LastResponse.status().answeredBy(actor);
    const body: any = await LastResponse.body().answeredBy(actor);
    lastResponse = { status, body };
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// THEN — Validaciones con FluentExpect
// ═══════════════════════════════════════════════════════════════════════════

Then(
  'el cuerpo debe contener {string} con valor true',
  async (campo: string) => {
    esperar(lastResponse.body).tengaPropiedad(campo);
    esperar(lastResponse.body[campo]).seaIgualA(true);
  },
);

Then(
  'el cuerpo debe contener un {string} que sea un JWT válido con 3 segmentos',
  async (campo: string) => {
    esperar(lastResponse.body).tengaPropiedad(campo);
    esperar(lastResponse.body[campo]).seaUnJwtValido();
  },
);

Then(
  'el tiempo de respuesta debe ser menor a {int}ms',
  async (limiteMs: number) => {
    esperar(lastResponse.duration).seaMenorQue(limiteMs);
    console.log(`[Performance] Respuesta en ${lastResponse.duration}ms (límite: ${limiteMs}ms)`);
  },
);

Then(
  'el cuerpo debe contener {string} con valor {string}',
  async (campo: string, valor: string) => {
    esperar(lastResponse.body).tengaPropiedad(campo);
    // El username puede incluir timestamp, por lo que hacemos contiene
    esperar(lastResponse.body[campo]).contenga(valor.replace(/"/g, ''));
  },
);

Then(
  'el cuerpo NO debe contener el campo {string}',
  async (campo: string) => {
    esperar(lastResponse.body).noTengaPropiedad(campo);
  },
);
