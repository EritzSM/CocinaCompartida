/**
 * Funcionalidad 5: Favorites/Bookmarks — like + verificación en pestaña Favoritos
 *
 * LLM calls: act (login button) → observe (like buttons) → act (click like) → extract (favoritos)
 * Token budget: ~7K — dentro del límite free-tier de Groq (8K/min)
 */
import { z } from "zod";
import { createStagehand } from "../src/index.js";
import { loginConIA } from "../src/login.js";
import { waitForURL, sleep } from "../src/utils.js";
import { assertGreaterThan, assertTruthy } from "../src/assert.js";
import "../src/env.js";

const BASE_URL = process.env.BASE_URL ?? "http://localhost";

async function main() {
  const sh = createStagehand();
  await sh.init();
  const page = sh.context.activePage()!;

  try {
    // ── LOGIN (1 LLM call via loginConIA) ────────────────────────────────────
    await loginConIA(sh);
    console.log("[login] OK");

    // ── Ir a /explore y tomar el nombre de la primera receta sin LLM ─────────
    await page.goto(`${BASE_URL}/explore`);
    await page.waitForLoadState("load");
    await sleep(2000);

    // Leer el nombre de la primera tarjeta con Playwright (sin tokens)
    const nombreReceta = await page
      .locator('h2, h3, [class*="title"], [class*="name"]')
      .first()
      .textContent()
      .catch(() => "primera receta");
    console.log(`[playwright] primera receta: "${nombreReceta}"`);

    // ── OBSERVE: botones de like ──────────────────────────────────────────────
    const botonesLike = await sh.observe(
      "botones de corazón, like o favorito en las tarjetas de recetas de la página"
    );
    console.log(`[observe] ${botonesLike.length} botones de like detectados`);
    assertGreaterThan(botonesLike.length, 0, "No se detectaron botones de like/corazón");

    // ── ACT: dar like a la primera receta ────────────────────────────────────
    await sh.act(
      "haz click en el botón de corazón o like de la primera tarjeta de receta visible"
    );
    await sleep(2000);
    console.log("[act] like aplicado");

    // ── Navegar a /profile con Playwright (sin tokens) ────────────────────────
    await page.goto(`${BASE_URL}/profile`);
    await waitForURL(page, /\/profile/, 10000);
    await page.waitForLoadState("load");
    await sleep(1500);

    // Click en pestaña Favoritos con Playwright si posible
    const tabFavoritos = page.locator(
      'button:has-text("Favoritos"), button:has-text("favorites"), [class*="tab"]:has-text("Favorit")'
    ).first();
    const tabCount = await tabFavoritos.count();
    if (tabCount > 0) {
      await tabFavoritos.click();
      await sleep(1000);
      console.log("[playwright] pestaña Favoritos clickeada");
    } else {
      // Fallback: usar LLM si no encontramos la pestaña con Playwright
      await sh.act("haz click en la pestaña o tab de Favoritos o Favoritas en el perfil");
      await sleep(1000);
      console.log("[act] pestaña Favoritos via IA");
    }

    // ── EXTRACT: lista de favoritos ───────────────────────────────────────────
    const favs = await sh.extract(
      "extrae los nombres de las recetas en la sección de favoritos o guardados del perfil del usuario",
      z.object({ favoritos: z.array(z.object({ nombre: z.string() })) })
    );
    console.log(`[extract] ${favs.favoritos.length} favoritos:`, favs.favoritos);
    assertGreaterThan(favs.favoritos.length, 0, "No aparecen favoritos en el perfil");

    console.log("✅ favorites-bookmarks PASSED");
    console.log(`   like dado a: "${nombreReceta}"`);
    console.log(`   favoritos en perfil: ${favs.favoritos.length}`);
  } finally {
    await sh.close();
  }
}

main().catch((e) => {
  console.error("❌ FAILED:", e);
  process.exit(1);
});
