/**
 * Demo: las 3 primitivas de Stagehand (observe, extract, act) sobre /home
 */
import { z } from "zod";
import { createStagehand } from "../src/index.js";
import { assertGreaterThan, assertTruthy } from "../src/assert.js";
import { waitForURL } from "../src/utils.js";
import "../src/env.js";

const BASE_URL = process.env.BASE_URL ?? "http://localhost";

async function main() {
  const sh = createStagehand();
  await sh.init();
  const page = sh.context.activePage()!;

  try {
    // ── OBSERVE ──────────────────────────────────────────────────────────────
    await page.goto(`${BASE_URL}/home`);
    await page.waitForLoadState("load");
    await page.waitForTimeout(1500);

    const elementos = await sh.observe(
      "tarjetas de recetas o sección de recetas populares o destacadas en la página"
    );
    console.log(`[observe] ${elementos.length} elementos detectados en /home`);
    assertGreaterThan(elementos.length, 0, "No se detectaron recetas en home");

    // ── EXTRACT ──────────────────────────────────────────────────────────────
    const datos = await sh.extract(
      "extrae las recetas mostradas en la página con su nombre, likes y autor si están visibles",
      z.object({
        recetas: z.array(
          z.object({
            nombre: z.string(),
            autor: z.string().nullable(),
            likes: z.number().nullable(),
          })
        ),
      })
    );
    console.log(`[extract] ${datos.recetas.length} recetas extraídas:`, datos.recetas);
    assertGreaterThan(datos.recetas.length, 0, "extract: no se encontraron recetas");

    const primera = datos.recetas[0];
    assertTruthy(primera.nombre, "La primera receta no tiene nombre");

    // ── ACT ──────────────────────────────────────────────────────────────────
    await sh.act(
      `haz click en el botón "Ver Receta" o en el enlace de la receta llamada "${primera.nombre}"`
    );
    await waitForURL(page, /\/recipe\//, 10000);
    console.log(`[act] navegó a: ${page.url()}`);
    assertTruthy(page.url().includes("/recipe/"), "No navegó a /recipe/:id");

    console.log("✅ observe-extract PASSED");
  } finally {
    await sh.close();
  }
}

main().catch((e) => {
  console.error("❌ FAILED:", e);
  process.exit(1);
});
