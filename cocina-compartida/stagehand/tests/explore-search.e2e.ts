/**
 * Funcionalidad 1: Frontend Explore — motor de búsqueda y navegación
 *
 * LLM calls: observe (search bar + cards) → act (write search) → act (click result)
 * Token budget: ~6K — dentro del límite free-tier de Groq (8K/min)
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
    await page.goto(`${BASE_URL}/explore`);
    await page.waitForLoadState("load");
    await sleep(2000);

    // ── OBSERVE: barra de búsqueda + recetas ─────────────────────────────────
    const elementos = await sh.observe(
      "campo de búsqueda en el header y tarjetas de recetas visibles en la página"
    );
    console.log(`[observe] ${elementos.length} elementos detectados (buscador + recetas)`);
    assertGreaterThan(elementos.length, 0, "No se detectaron elementos en /explore");

    // ── EXTRACT: recetas actuales ─────────────────────────────────────────────
    const lista = await sh.extract(
      "extrae los nombres de las primeras 4 recetas visibles en la página",
      z.object({ recetas: z.array(z.object({ nombre: z.string() })) })
    );
    console.log(`[extract] ${lista.recetas.length} recetas:`, lista.recetas.map((r) => r.nombre));
    assertGreaterThan(lista.recetas.length, 0, "No se extrajeron recetas de /explore");

    // Buscar con la primera palabra del nombre de la primera receta
    const palabraBusqueda = lista.recetas[0].nombre.split(" ")[0];
    console.log(`[act] buscando: "${palabraBusqueda}"`);

    // Llenar el buscador con Playwright (determinístico, sin tokens)
    const searchInput = page
      .locator('input[placeholder*="uscar"], input[type="search"], input[name="search"]')
      .first();
    await searchInput.fill(palabraBusqueda);
    await sleep(1200);

    // ── ACT: navegar a la primera receta que aparece ──────────────────────────
    await sh.act(
      "haz click en la primera tarjeta de receta visible o en el primer resultado de búsqueda para ver el detalle"
    );
    await waitForURL(page, /\/recipe\//, 12000);
    console.log(`[act] navegó a: ${page.url()}`);
    assertTruthy(page.url().includes("/recipe/"), "No navegó a /recipe/:id tras buscar");

    console.log("✅ explore-search PASSED");
    console.log(`   búsqueda: "${palabraBusqueda}"`);
    console.log(`   recetas encontradas: ${lista.recetas.length}`);
    console.log(`   navegó a: ${page.url()}`);
  } finally {
    await sh.close();
  }
}

main().catch((e) => {
  console.error("❌ FAILED:", e);
  process.exit(1);
});
