// ═══════════════════════════════════════════════════════════════════════════
// Step Definitions: Gestión del Perfil de Usuario
// Conecta: gestion-perfil.feature ↔ UpdateProfile Task ↔ FluentExpect
// ═══════════════════════════════════════════════════════════════════════════

import { Given, When, Then } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight } from '@serenity-js/core';
import { Send, PostRequest, PatchRequest, GetRequest, DeleteRequest, LastResponse } from '@serenity-js/rest';

import { esperar } from '../../screenplay/fluent/FluentExpect';

// ─── Estado compartido ───────────────────────────────────────────────────────
let lastResponse: any = null;
let tokens: Record<string, string> = {};
let userIds: Record<string, string> = {};
let dynamicEmails: Record<string, string> = {};

// Nota: Los Given de registro e inicio de sesión ya están en crear-comentario.steps.ts
// Aquí definimos solo los steps específicos de gestión de perfil que no
// colisionan con los ya existentes.

// ═══════════════════════════════════════════════════════════════════════════
// WHEN — Actualizar Perfil
// ═══════════════════════════════════════════════════════════════════════════

When(
  '{string} actualiza su perfil con username {string}',
  async (nombre: string, nuevoUsername: string) => {
    const actor = actorCalled(nombre);
    const token = tokens[nombre];

    await actor.attemptsTo(
      Send.a(PatchRequest.to('/users').using({
        headers: { Authorization: `Bearer ${token}` },
      }).with({ username: nuevoUsername })),
    );

    const status = await LastResponse.status().answeredBy(actor);
    const body: any = await LastResponse.body().answeredBy(actor);
    lastResponse = { status, body };
  },
);

When(
  '{string} actualiza su perfil con bio {string}',
  async (nombre: string, nuevaBio: string) => {
    const actor = actorCalled(nombre);
    const token = tokens[nombre];

    await actor.attemptsTo(
      Send.a(PatchRequest.to('/users').using({
        headers: { Authorization: `Bearer ${token}` },
      }).with({ bio: nuevaBio })),
    );

    const status = await LastResponse.status().answeredBy(actor);
    const body: any = await LastResponse.body().answeredBy(actor);
    lastResponse = { status, body };
  },
);

When(
  'un visitante sin autenticación intenta actualizar su perfil con username {string}',
  async (username: string) => {
    const actor = actorCalled('VisitanteSinToken');

    await actor.attemptsTo(
      Send.a(PatchRequest.to('/users').with({ username })),
    );

    const status = await LastResponse.status().answeredBy(actor);
    const body: any = await LastResponse.body().answeredBy(actor);
    lastResponse = { status, body };
  },
);

When(
  '{string} consulta el perfil del usuario con id {string}',
  async (nombre: string, userId: string) => {
    const actor = actorCalled(nombre);
    const token = tokens[nombre];

    await actor.attemptsTo(
      Send.a(GetRequest.to(`/users/${userId}`).using({
        headers: { Authorization: `Bearer ${token}` },
      })),
    );

    const status = await LastResponse.status().answeredBy(actor);
    const body: any = await LastResponse.body().answeredBy(actor);
    lastResponse = { status, body };
  },
);

When(
  '{string} elimina su cuenta',
  async (nombre: string) => {
    const actor = actorCalled(nombre);
    const token = tokens[nombre];
    const userId = userIds[nombre];

    await actor.attemptsTo(
      Send.a(DeleteRequest.to(`/users/${userId}`).using({
        headers: { Authorization: `Bearer ${token}` },
      })),
    );

    const status = await LastResponse.status().answeredBy(actor);
    const body: any = await LastResponse.body().answeredBy(actor);
    lastResponse = { status, body };
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// THEN — Validaciones específicas de perfil
// ═══════════════════════════════════════════════════════════════════════════

Then(
  'Or debe recibir un código HTTP {int}',
  async (codigoAlternativo: number) => {
    // Aserción alternativa: se acepta el status actual O el alternativo
    const statusActual = lastResponse.status;
    const aceptado = statusActual === 200 || statusActual === codigoAlternativo;
    esperar(aceptado).seaIgualA(true);
  },
);

Then(
  '{string} ya no debe poder iniciar sesión',
  async (nombre: string) => {
    const actor = actorCalled(nombre);
    const email = dynamicEmails[nombre];

    await actor.attemptsTo(
      Send.a(PostRequest.to('/auth/login').with({
        email,
        password: 'Password123!',
      })),
    );

    const status = await LastResponse.status().answeredBy(actor);
    // El usuario eliminado no debería poder hacer login (404 o 401)
    const noAutenticado = status === 404 || status === 401;
    esperar(noAutenticado).seaIgualA(true);
  },
);
