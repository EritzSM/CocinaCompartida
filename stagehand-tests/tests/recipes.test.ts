/**
 * recipes.test.ts — Pruebas de Recetas
 *
 * Patrón Stagehand:
 *   observe() → detecta elementos interactivos en la página
 *   act()     → interactúa con la UI en lenguaje natural
 *   extract() → extrae datos estructurados de la página
 *
 * Tests:
 *   1. Formulario de receta: observe + extract para ver los campos
 *   2. Rellenar formulario: act para escribir + extract para confirmar
 *   3. Página Explore: observe + extract para ver el estado del feed
 */

import "dotenv/config";
import { z } from "zod";
import { Stagehand } from "@browserbasehq/stagehand";
import { BASE_URL, TEST_CREDENTIALS, log, runTest, createStagehand } from "../utils/stagehand.utils.js";

/** Helper: hace login con act() una sola vez al inicio */
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
// TEST 1: Formulario de receta — observe() detecta campos, extract() los valida
// ─────────────────────────────────────────────────────────────────────────────
async function testFormularioObserveYExtract(sh: Stagehand) {
  await sh.page.goto(`${BASE_URL}/recipe-upload`);
  await sh.page.waitForLoadState("networkidle");

  // OBSERVE: la IA detecta todos los campos y controles del formulario
  const elementos = await sh.page.observe(
    "Lista todos los campos de texto, selectores, botones y controles disponibles en el formulario de crear receta"
  );
  log("INFO", `observe() encontró ${elementos.length} elementos en el formulario`);

  if (elementos.length === 0) {
    throw new Error("observe() no detectó ningún elemento — ¿la página cargó correctamente?");
  }

  // EXTRACT: la IA confirma qué campos específicos existen
  const formulario = await sh.page.extract({
    instruction: "¿El formulario de crear receta tiene campo para nombre, ingredientes y pasos de preparación?",
    schema: z.object({
      tieneNombre: z.boolean().describe("Campo para el nombre de la receta"),
      tieneIngredientes: z.boolean().describe("Campo o sección de ingredientes"),
      tienePasos: z.boolean().describe("Campo o sección de pasos de preparación"),
      tieneBotonGuardar: z.boolean().describe("Botón para guardar o publicar"),
      textoBoton: z.string().optional().describe("El texto del botón de guardar"),
    }),
  });

  log("INFO", `extract() campos: ${JSON.stringify(formulario)}`);

  if (!formulario.tieneNombre) throw new Error("Falta el campo de nombre de receta");
  if (!formulario.tieneBotonGuardar) throw new Error("Falta el botón de guardar");
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: Rellenar formulario — act() escribe, observe() + extract() verifican
// ─────────────────────────────────────────────────────────────────────────────
async function testRellenarFormulario(sh: Stagehand) {
  await sh.page.goto(`${BASE_URL}/recipe-upload`);
  await sh.page.waitForLoadState("networkidle");

  // ACT: la IA rellena cada campo del formulario con lenguaje natural
  await sh.page.act("Escribe 'Tacos de Pollo al Pastor' en el campo de nombre de la receta");
  await sh.page.act("Escribe 'Pollo, tortillas, chile guajillo, piña, cebolla, cilantro' en el campo de ingredientes");
  await sh.page.act("Escribe 'Marinar el pollo con las especias. Cocinar a fuego medio. Servir en tortillas.' en el campo de pasos o instrucciones");

  // OBSERVE: verificar qué controles quedan disponibles después de rellenar
  const controlesDisponibles = await sh.page.observe(
    "¿Qué botones de acción están disponibles ahora en el formulario (guardar, publicar, cancelar)?"
  );
  log("INFO", `observe() post-relleno: ${controlesDisponibles.length} controles disponibles`);

  // EXTRACT: confirmar que el nombre se escribió correctamente
  const valores = await sh.page.extract({
    instruction: "¿Cuál es el valor actual del campo de nombre de la receta?",
    schema: z.object({
      nombreActual: z.string().describe("El texto actual en el campo de nombre"),
    }),
  });

  log("INFO", `extract() nombre en formulario: "${valores.nombreActual}"`);

  if (!valores.nombreActual.toLowerCase().includes("tacos")) {
    throw new Error(`El nombre no se escribió correctamente. Valor: "${valores.nombreActual}"`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: Página Explore — observe() detecta recetas, extract() resume el estado
// ─────────────────────────────────────────────────────────────────────────────
async function testExploreFeed(sh: Stagehand) {
  // ACT: navegar a la página de explorar
  await sh.page.goto(`${BASE_URL}/explore`);
  await sh.page.waitForLoadState("networkidle");

  // OBSERVE: la IA detecta las tarjetas de receta y elementos interactivos del feed
  const elementosFeed = await sh.page.observe(
    "Identifica las tarjetas de recetas, botones de like y enlaces disponibles en el feed"
  );
  log("INFO", `observe() elementos en el feed: ${elementosFeed.length}`);

  // EXTRACT: la IA resume el estado del feed de forma estructurada
  const estadoFeed = await sh.page.extract({
    instruction: "¿La página de explorar muestra tarjetas de recetas? ¿Cuántas hay aproximadamente?",
    schema: z.object({
      cargoBien: z.boolean().describe("La página cargó sin errores"),
      hayRecetas: z.boolean().describe("Hay tarjetas de recetas visibles"),
      cantidadAproximada: z.number().optional().describe("Número estimado de recetas"),
    }),
  });

  log("INFO", `extract() estado del feed: ${JSON.stringify(estadoFeed)}`);

  if (!estadoFeed.cargoBien) {
    throw new Error("La página de Explore no cargó correctamente");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Ejecutar todos los tests con UN solo browser y UN solo login
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n🍳 ══════════════════════════════════════");
console.log("   Tests de Recetas  |  act · observe · extract");
console.log("══════════════════════════════════════\n");

const sh = await createStagehand();
try {
  await login(sh); // login una sola vez — sesión persiste

  await runTest(
    "Formulario: observe() detecta campos y extract() valida su presencia",
    testFormularioObserveYExtract,
    sh
  );
  await runTest(
    "Formulario: act() rellena los campos y extract() confirma los valores",
    testRellenarFormulario,
    sh
  );
  await runTest(
    "Explore: observe() detecta recetas y extract() resume el estado del feed",
    testExploreFeed,
    sh
  );
} finally {
  await sh.close();
}

console.log("\n✅ Tests de recetas finalizados.\n");
