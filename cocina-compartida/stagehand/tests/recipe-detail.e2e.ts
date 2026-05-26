/**
 * Funcionalidad 2: Frontend Recipe Detail — ingredientes, pasos y autor
 *
 * Flujo:
 *   1. Abre /explore y entra a la primera receta
 *   2. observe: secciones de ingredientes y pasos
 *   3. extract: ingredientes, pasos, nombre, autor
 *   4. assert: hay al menos 1 ingrediente y 1 paso, y el autor no está vacío
 */
import { z } from "zod";
import { createStagehand } from "../src/index.js";
import { assertGreaterThan, assertTruthy } from "../src/assert.js";
import { waitForURL, sleep } from "../src/utils.js";
import "../src/env.js";

const BASE_URL = process.env.BASE_URL ?? "http://localhost";

async function main() {
  const sh = createStagehand();
  await sh.init();
  const page = sh.context.activePage()!;

  try {
    // ── Entrar a la primera receta desde /explore ────────────────────────────
    await page.goto(`${BASE_URL}/explore`);
    await page.waitForLoadState("load");
    await sleep(2000);

    await sh.act(
      "haz click en la primera tarjeta de receta visible para ver su detalle"
    );
    await waitForURL(page, /\/recipe\//, 12000);
    await page.waitForLoadState("load");
    await sleep(1500);
    console.log(`[nav] receta en: ${page.url()}`);

    // ── OBSERVE: secciones de la página ─────────────────────────────────────
    const secciones = await sh.observe(
      "secciones visibles de la receta: ingredientes, pasos o instrucciones, y nombre del autor o creador"
    );
    console.log(`[observe] ${secciones.length} secciones detectadas`);
    assertGreaterThan(secciones.length, 0, "No se detectaron secciones en la receta");

    // ── Scroll para ver todo el contenido ────────────────────────────────────
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await sleep(800);

    // ── EXTRACT: datos estructurados de la receta ────────────────────────────
    const recetaSchema = z.object({
      nombre: z.string(),
      autor: z.string().nullable(),
      descripcion: z.string().nullable(),
      ingredientes: z.array(z.string()),
      pasos: z.array(z.string()),
    });

    const receta = await sh.extract(
      "extrae de la receta: el nombre completo, el autor o usuario que la publicó, la descripción, la lista de ingredientes y la lista de pasos o instrucciones de preparación",
      recetaSchema
    );
    console.log("[extract] receta:", JSON.stringify(receta, null, 2));

    // ── ASSERT ───────────────────────────────────────────────────────────────
    assertTruthy(receta.nombre, "La receta no tiene nombre");
    assertGreaterThan(
      receta.ingredientes.length,
      0,
      "La receta no tiene ingredientes listados"
    );
    assertGreaterThan(
      receta.pasos.length,
      0,
      "La receta no tiene pasos de preparación"
    );
    assertTruthy(receta.autor, "La receta no muestra autor");

    // ── ACT: scroll al fondo para ver pasos completos ────────────────────────
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(600);
    const seccionesFondo = await sh.observe(
      "sección de comentarios o botones de descarga al fondo de la página"
    );
    console.log(`[observe fondo] ${seccionesFondo.length} elementos adicionales detectados`);

    console.log("✅ recipe-detail PASSED");
    console.log(`   nombre: ${receta.nombre}`);
    console.log(`   autor: ${receta.autor}`);
    console.log(`   ingredientes: ${receta.ingredientes.length}`);
    console.log(`   pasos: ${receta.pasos.length}`);
  } finally {
    await sh.close();
  }
}

main().catch((e) => {
  console.error("❌ FAILED:", e);
  process.exit(1);
});
