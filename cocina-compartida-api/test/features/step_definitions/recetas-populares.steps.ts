// ═══════════════════════════════════════════════════════════════════════════
// Step Definitions: Recetas Populares — Ordenamiento y Rendimiento
// Conecta: recetas-populares.feature ↔ RequestPopularRecipes Task ↔ LasRecetasPopulares Question ↔ FluentExpect
// ═══════════════════════════════════════════════════════════════════════════

import { When, Then } from '@cucumber/cucumber';
import { actorCalled } from '@serenity-js/core';
import { Send, GetRequest, LastResponse } from '@serenity-js/rest';

import { LasRecetasPopulares } from '../../screenplay/questions/LasRecetasPopulares';
import { esperar } from '../../screenplay/fluent/FluentExpect';

// ─── Estado compartido ───────────────────────────────────────────────────────
let lastResponse: any = null;
let allConcurrentResponses: any[] = [];

// ═══════════════════════════════════════════════════════════════════════════
// WHEN
// ═══════════════════════════════════════════════════════════════════════════

When(
  'un visitante consulta las recetas populares',
  async () => {
    const actor = actorCalled('VisitantePopulares');

    const inicio = Date.now();
    await actor.attemptsTo(
      Send.a(GetRequest.to('/recipes/top-liked')),
    );

    const status = await LastResponse.status().answeredBy(actor);
    const body: any = await LastResponse.body().answeredBy(actor);
    lastResponse = { status, body, duration: Date.now() - inicio };
  },
);

When(
  '{int} visitantes consultan las recetas populares simultáneamente',
  async (cantidad: number) => {
    const inicio = Date.now();

    // Simulamos peticiones concurrentes con múltiples actores
    const promesas = Array.from({ length: cantidad }, async (_, i) => {
      const actor = actorCalled(`Concurrente_${i + 1}`);
      await actor.attemptsTo(
        Send.a(GetRequest.to('/recipes/top-liked')),
      );
      const status = await LastResponse.status().answeredBy(actor);
      const body: any = await LastResponse.body().answeredBy(actor);
      return { status, body };
    });

    allConcurrentResponses = await Promise.all(promesas);
    lastResponse = { duration: Date.now() - inicio };
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// THEN — Validaciones con Question + FluentExpect
// ═══════════════════════════════════════════════════════════════════════════

Then(
  'la respuesta debe ser un arreglo',
  async () => {
    esperar(lastResponse.body).seaUnArreglo();
  },
);

Then(
  'cada receta debe tener las propiedades {string}, {string} y {string}',
  async (prop1: string, prop2: string, prop3: string) => {
    // ── Question: extraer y validar con LasRecetasPopulares ──
    const populares = LasRecetasPopulares.desde(lastResponse);
    esperar(populares.todasTienenContratoCompleto).seaIgualA(true);
  },
);

Then(
  '{string} debe ser de tipo string',
  async (campo: string) => {
    const populares = LasRecetasPopulares.desde(lastResponse);
    if (populares.primera) {
      esperar(typeof populares.primera[campo]).seaIgualA('string');
    }
  },
);

Then(
  '{string} debe ser de tipo number',
  async (campo: string) => {
    const populares = LasRecetasPopulares.desde(lastResponse);
    if (populares.primera) {
      esperar(typeof populares.primera[campo]).seaIgualA('number');
    }
  },
);

Then(
  'la respuesta debe contener como máximo {int} recetas',
  async (maximo: number) => {
    const populares = LasRecetasPopulares.desde(lastResponse);
    esperar(populares.lista).tengaComoMaximo(maximo);
  },
);

Then(
  'las recetas deben estar ordenadas por likes en orden descendente',
  async () => {
    const populares = LasRecetasPopulares.desde(lastResponse);
    esperar(populares.estaOrdenadaPorLikes).seaIgualA(true);
  },
);

Then(
  'todas las respuestas deben tener código HTTP {int}',
  async (codigo: number) => {
    allConcurrentResponses.forEach((resp) => {
      esperar(resp.status).seaIgualA(codigo);
    });
  },
);

Then(
  'el tiempo total debe ser menor a {int}ms',
  async (limiteMs: number) => {
    esperar(lastResponse.duration).seaMenorQue(limiteMs);
    console.log(
      `[Performance] Carga concurrente completada en ${lastResponse.duration}ms (límite: ${limiteMs}ms)`,
    );
  },
);
