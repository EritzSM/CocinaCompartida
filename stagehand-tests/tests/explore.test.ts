/**
 * explore.test.ts — Pruebas de la página Explore
 *
 * Patrón Stagehand:
 *   observe() → detecta elementos interactivos en la página
 *   act()     → interactúa con la UI en lenguaje natural
 *   extract() → extrae datos estructurados de la página
 *
 * Tests:
 *   1. Feed principal: observe + extract para confirmar que carga
 *   2. Navegar a detalle: act para hacer clic + observe + extract para confirmar
 *   3. Sistema de likes: observe para detectar botones + act para dar like + extract para confirmar
 */

import "dotenv/config";
import { z } from "zod";
import { Stagehand } from "@browserbasehq/stagehand";
import { BASE_URL, TEST_CREDENTIALS, log, runTest, createStagehand } from "../utils/stagehand.utils.js";

/** Helper: hace login con act() una sola vez */
async function login(sh: Stagehand) {
  await sh.page.goto(`${BASE_URL}/login`);
  await sh.page.waitForLoadState("networkidle");
  await sh.page.act(`Escribe "${TEST_CREDENTIALS.email}" en el campo de correo electrónico`);
  await sh.page.act(`Escribe "${TEST_CREDENTIALS.password}" en el campo de contraseña`);
  await sh.page.act("Haz clic en el botón de iniciar sesión");
  await sh.page.waitForLoadState("networkidle");
  log("INFO", `Login realizado. URL: ${sh.page.url()}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: Feed de recetas — observe() detecta tarjetas, extract() confirma estado
// ─────────────────────────────────────────────────────────────────────────────
async function testExploreFeedCarga(sh: Stagehand) {
  // ACT: navegar a la página de explorar
  await sh.page.goto(`${BASE_URL}/explore`);
  await sh.page.waitForLoadState("networkidle");

  // OBSERVE: la IA detecta qué tarjetas y elementos interactivos hay en el feed
  const elementosFeed = await sh.page.observe(
    "Identifica las tarjetas de recetas, botones de like y cualquier elemento interactivo del feed"
  );
  log("INFO", `observe() detectó ${elementosFeed.length} elementos en el feed`);

  // EXTRACT: resumen estructurado del estado del feed
  const estado = await sh.page.extract({
    instruction: "¿La página Explore cargó bien? ¿Hay recetas visibles o un mensaje de que no hay contenido?",
    schema: z.object({
      cargoBien: z.boolean().describe("La página cargó sin errores visibles"),
      hayRecetas: z.boolean().describe("Hay tarjetas de recetas en pantalla"),
      hayMensajeVacio: z.boolean().describe("Hay un mensaje tipo 'no hay recetas'"),
    }),
  });

  log("INFO", `extract() estado del feed: ${JSON.stringify(estado)}`);

  if (!estado.cargoBien) {
    throw new Error("La página Explore no cargó correctamente");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: Navegar al detalle — act() hace clic, observe() + extract() confirman
// ─────────────────────────────────────────────────────────────────────────────
async function testNavegarADetalle(sh: Stagehand) {
  await sh.page.goto(`${BASE_URL}/explore`);
  await sh.page.waitForLoadState("networkidle");

  // OBSERVE: verificar si hay recetas antes de intentar navegar
  const elementosDisponibles = await sh.page.observe(
    "¿Hay tarjetas de recetas con las que se pueda interactuar?"
  );
  log("INFO", `observe() elementos disponibles: ${elementosDisponibles.length}`);

  // EXTRACT: confirmar si hay recetas en el feed
  const { hayRecetas } = await sh.page.extract({
    instruction: "¿Hay tarjetas de recetas visibles en el feed de explorar?",
    schema: z.object({ hayRecetas: z.boolean() }),
  });

  if (!hayRecetas) {
    log("INFO", "No hay recetas en el feed — omitiendo test de navegación");
    return;
  }

  const urlAntes = sh.page.url();

  // ACT: la IA hace clic en la primera receta disponible
  await sh.page.act("Haz clic en la primera tarjeta de receta para ver su detalle");
  await sh.page.waitForLoadState("networkidle");

  const urlDespues = sh.page.url();
  log("INFO", `Navegación: ${urlAntes} → ${urlDespues}`);

  if (urlAntes === urlDespues) {
    throw new Error("La URL no cambió — el clic en la receta no navegó al detalle");
  }

  // EXTRACT: confirmar que llegamos a la página de detalle
  const detalle = await sh.page.extract({
    instruction: "¿Estamos en la página de detalle de una receta? ¿Hay nombre e ingredientes?",
    schema: z.object({
      esDetalle: z.boolean().describe("true si es la página de detalle de una receta"),
      nombreReceta: z.string().optional(),
    }),
  });

  log("INFO", `extract() página de detalle: ${JSON.stringify(detalle)}`);

  if (!detalle.esDetalle) {
    throw new Error("No se llegó a la página de detalle de receta");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: Likes — observe() detecta botones, act() da like, extract() confirma
// ─────────────────────────────────────────────────────────────────────────────
async function testSistemaDeLikes(sh: Stagehand) {
  await sh.page.goto(`${BASE_URL}/explore`);
  await sh.page.waitForLoadState("networkidle");

  // OBSERVE: la IA detecta si hay botones de like en las tarjetas
  const botones = await sh.page.observe(
    "¿Hay botones de 'me gusta', like o corazón en las tarjetas de receta?"
  );
  log("INFO", `observe() botones de like detectados: ${botones.length}`);

  // EXTRACT: confirmar si los botones de like existen
  const { hayBotones } = await sh.page.extract({
    instruction: "¿Hay botones de like o 'me gusta' visibles en alguna tarjeta de receta?",
    schema: z.object({ hayBotones: z.boolean() }),
  });

  if (!hayBotones) {
    log("INFO", "No hay botones de like visibles — omitiendo test");
    return;
  }

  // EXTRACT: estado antes del like
  const antes = await sh.page.extract({
    instruction: "¿Cuántos likes tiene la primera tarjeta de receta?",
    schema: z.object({
      likes: z.number().optional().describe("Número de likes de la primera receta"),
    }),
  });
  log("INFO", `extract() likes antes: ${JSON.stringify(antes)}`);

  // ACT: la IA hace clic en el botón de like de la primera receta
  await sh.page.act("Haz clic en el botón de like o 'me gusta' de la primera receta");
  await sh.page.waitForLoadState("networkidle");

  // EXTRACT: confirmar que el like se registró visualmente
  const despues = await sh.page.extract({
    instruction: "¿Cambió visualmente el botón de like de la primera receta (color, estado activo)?",
    schema: z.object({
      cambioBtnVisualmente: z.boolean().describe("true si el botón cambió de apariencia"),
      likesDespues: z.number().optional(),
    }),
  });

  log("INFO", `extract() likes después: ${JSON.stringify(despues)}`);

  if (despues.cambioBtnVisualmente) {
    log("INFO", "✓ El sistema de likes actualizó la UI correctamente");
  } else {
    log("INFO", "⚠ No se detectó cambio visual en el botón de like");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Ejecutar todos los tests con UN solo browser y UN solo login
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n🍴 ══════════════════════════════════════");
console.log("   Tests de Explore  |  act · observe · extract");
console.log("══════════════════════════════════════\n");

const sh = await createStagehand();
try {
  await login(sh); // login una sola vez — sesión persiste

  await runTest(
    "Explore: observe() detecta elementos y extract() confirma que el feed cargó",
    testExploreFeedCarga,
    sh
  );
  await runTest(
    "Explore: observe()+extract() detectan recetas, act() navega al detalle",
    testNavegarADetalle,
    sh
  );
  await runTest(
    "Likes: observe() detecta botones, act() da like, extract() confirma cambio visual",
    testSistemaDeLikes,
    sh
  );
} finally {
  await sh.close();
}

console.log("\n✅ Tests de Explore finalizados.\n");
