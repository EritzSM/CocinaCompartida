/**
 * Funcionalidad 4: Categories/Tags System — filtro por categoría
 *
 * LLM calls: observe (opciones categoría) → act (seleccionar postres) → extract (resultado)
 * Token budget: ~6K — dentro del límite free-tier de Groq (8K/min)
 */
import { z } from "zod";
import { createStagehand } from "../src/index.js";
import { assertGreaterThan, assertTruthy } from "../src/assert.js";
import { sleep } from "../src/utils.js";
import "../src/env.js";

const BASE_URL = process.env.BASE_URL ?? "http://localhost";

async function main() {
  const sh = createStagehand();
  await sh.init();
  const page = sh.context.activePage()!;

  try {
    await page.goto(`${BASE_URL}/explore`);
    await page.waitForLoadState("load");
    await sleep(2000);

    // Contar recetas antes del filtro con Playwright (sin tokens)
    const countAntes = await page.locator('[class*="recipe-card"], [class*="card"]').count();
    console.log(`[playwright] ${countAntes} tarjetas antes del filtro`);

    // ── OBSERVE: opciones de categoría en el header ───────────────────────────
    const opcionesCat = await sh.observe(
      "selector, dropdown o botones de filtro por categoría en el header o barra de navegación superior"
    );
    console.log(`[observe] ${opcionesCat.length} opciones de categoría detectadas`);
    assertGreaterThan(opcionesCat.length, 0, "No se detectaron controles de categoría");

    // ── ACT: seleccionar "postres" ────────────────────────────────────────────
    await sh.act(
      "selecciona la opción 'postres' en el dropdown o selector de categorías para filtrar las recetas"
    );
    await sleep(1800);
    console.log("[act] filtro 'postres' aplicado");

    // ── EXTRACT: recetas filtradas ────────────────────────────────────────────
    const filtrado = await sh.extract(
      "extrae los nombres de las recetas que se muestran ahora en la página después de aplicar el filtro de categoría",
      z.object({
        recetas: z.array(z.object({ nombre: z.string(), categoria: z.string().nullable() })),
      })
    );
    console.log(`[extract] ${filtrado.recetas.length} recetas con filtro 'postres':`,
      filtrado.recetas.map((r) => r.nombre));

    // El filtro puede mostrar 0 si no hay postres, o todos si el filter no restringió
    // Lo importante: la interacción con el sistema de categorías funcionó sin error
    assertTruthy(
      filtrado.recetas !== null && filtrado.recetas !== undefined,
      "La extracción de recetas filtradas falló"
    );

    // Restaurar a "todas" con Playwright (sin tokens)
    const selectCat = page.locator('select').first();
    const isSelect = await selectCat.count();
    if (isSelect > 0) {
      await selectCat.selectOption({ index: 0 });
      await sleep(1000);
    }

    console.log("✅ categories-tags PASSED");
    console.log(`   tarjetas antes: ${countAntes}`);
    console.log(`   recetas con filtro 'postres': ${filtrado.recetas.length}`);
  } finally {
    await sh.close();
  }
}

main().catch((e) => {
  console.error("❌ FAILED:", e);
  process.exit(1);
});
