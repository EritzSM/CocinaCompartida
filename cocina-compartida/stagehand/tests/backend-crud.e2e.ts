/**
 * Funcionalidad 3: Backend Recipe CRUD — Create, Read, Update, Delete
 *
 * LLM calls:
 *   login:  act(email) + act(password) + act(button) = 3 LLM  [act ✓]
 *   main:   extract(READ) + observe(secciones)        = 2 LLM  [extract ✓, observe ✓]
 *   Total: ~5 LLM calls — dentro del límite Groq con caché
 *
 * Las operaciones CRUD se hacen vía fetch/API directo (0 LLM):
 *   POST /api/recipes   → CREATE
 *   PATCH /api/recipes/:id → UPDATE
 *   DELETE /api/recipes/:id → DELETE
 *   READ verificado con sh.extract tras page.goto al recurso
 */
import { z } from "zod";
import { createStagehand } from "../src/index.js";
import { loginConIA } from "../src/login.js";
import { assertTruthy, assertIncludes } from "../src/assert.js";
import { sleep } from "../src/utils.js";
import "../src/env.js";

const BASE_URL = process.env.BASE_URL ?? "http://localhost";
const TS = Date.now();
const NOMBRE_INICIAL = `RECETA_IA_${TS}`;
const NOMBRE_EDITADO = `RECETA_EDITADA_${TS}`;

async function fetchAPI(
  page: ReturnType<ReturnType<typeof createStagehand>["context"]["activePage"]>,
  method: string,
  path: string,
  token: string,
  body?: object
) {
  return page.evaluate(
    async (args: { method: string; path: string; tok: string; body?: object }) => {
      const opts: RequestInit = {
        method: args.method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${args.tok}`,
        },
      };
      if (args.body) opts.body = JSON.stringify(args.body);
      const r = await fetch(args.path, opts);
      const text = await r.text();
      let data: unknown = null;
      try { data = JSON.parse(text); } catch { data = text; }
      return { status: r.status, data };
    },
    { method, path, tok: token, body }
  );
}

async function main() {
  const sh = createStagehand();
  await sh.init();
  const page = sh.context.activePage()!;

  let recipeId: string | null = null;

  try {
    // ── LOGIN (3 LLM: email act + password act + button act) ─────────────────
    await loginConIA(sh);
    console.log("[login] OK");

    // ── Obtener JWT de localStorage (0 LLM) ──────────────────────────────────
    const token = (await page.evaluate(() => localStorage.getItem("token"))) as string;
    assertTruthy(token, "No se encontró JWT en localStorage");

    // ── CREATE via API (0 LLM) ────────────────────────────────────────────────
    const createResult = await fetchAPI(page, "POST", "/api/recipes", token, {
      name: NOMBRE_INICIAL,
      descripcion: "Receta creada por test E2E Stagehand",
      ingredients: ["harina 200g", "azúcar 100g", "mantequilla 80g"],
      steps: ["Precalentar horno", "Mezclar y hornear 25 min"],
      category: "postres",
      images: [],
    });
    console.log(`[CREATE] status=${createResult.status}`);
    assertTruthy(
      createResult.status === 201 || createResult.status === 200,
      `CREATE falló: status=${createResult.status} — ${JSON.stringify(createResult.data)}`
    );
    recipeId = (createResult.data as { id: string }).id;
    assertTruthy(recipeId, "CREATE sin id en respuesta");
    console.log(`[CREATE] ✓ id=${recipeId}`);

    // ── READ: navegar y verificar con sh.extract (1 LLM) ─────────────────────
    await page.goto(`${BASE_URL}/recipe/${recipeId}`);
    await page.waitForLoadState("load");
    await sleep(1500);

    const lectura = await sh.extract(
      "extrae el nombre completo de la receta y cuántos ingredientes aparecen listados",
      z.object({ nombre: z.string(), cantIngredientes: z.number().nullable() })
    );
    console.log("[READ] extract:", lectura);
    assertIncludes(lectura.nombre, "RECETA_IA", `READ: nombre incorrecto="${lectura.nombre}"`);

    // ── OBSERVE: secciones de la receta (1 LLM) ───────────────────────────────
    const secciones = await sh.observe(
      "secciones de ingredientes y pasos de preparación de la receta"
    );
    console.log(`[observe] ${secciones.length} secciones detectadas`);
    assertTruthy(secciones.length > 0, "observe: no detectó secciones en la receta");

    // ── UPDATE via API (0 LLM) ────────────────────────────────────────────────
    const updateResult = await fetchAPI(page, "PATCH", `/api/recipes/${recipeId}`, token, {
      name: NOMBRE_EDITADO,
    });
    console.log(`[UPDATE] status=${updateResult.status}`);
    assertTruthy(updateResult.status === 200, `UPDATE falló: status=${updateResult.status}`);

    // Verificar UPDATE con Playwright (0 LLM): recargar y leer el <title> o <h1>
    await page.reload();
    await page.waitForLoadState("load");
    await sleep(1000);
    const pageText = await page.evaluate(() => document.body.innerText);
    assertTruthy(
      pageText.includes("EDITADA"),
      `UPDATE no reflejado en UI — pageText no contiene "EDITADA"`
    );
    console.log("[UPDATE] ✓ nombre actualizado visible en UI");

    // ── DELETE via API (0 LLM) ────────────────────────────────────────────────
    const deleteResult = await fetchAPI(page, "DELETE", `/api/recipes/${recipeId}`, token);
    console.log(`[DELETE] status=${deleteResult.status}`);
    assertTruthy(
      deleteResult.status === 200 || deleteResult.status === 204,
      `DELETE falló: status=${deleteResult.status}`
    );

    // Verificar 404 (0 LLM)
    await sleep(400);
    const check = await fetchAPI(page, "GET", `/api/recipes/${recipeId}`, token);
    console.log(`[DELETE verify] GET → ${check.status}`);
    assertTruthy(
      check.status === 404 || check.status === 400,
      `Receta aún existe tras DELETE: status=${check.status}`
    );

    recipeId = null;

    console.log("✅ backend-crud PASSED");
    console.log(`   CREATE: ${NOMBRE_INICIAL}`);
    console.log(`   READ: "${lectura.nombre}" (${lectura.cantIngredientes ?? "?"} ingredientes)`);
    console.log(`   UPDATE: ${NOMBRE_EDITADO}`);
    console.log("   DELETE: 404 confirmado");
  } finally {
    if (recipeId) {
      const tok = (await page
        .evaluate(() => localStorage.getItem("token"))
        .catch(() => null)) as string | null;
      if (tok) {
        await fetchAPI(page, "DELETE", `/api/recipes/${recipeId}`, tok).catch(() => {});
        console.log(`[cleanup] receta ${recipeId} eliminada`);
      }
    }
    await sh.close();
  }
}

main().catch((e) => {
  console.error("❌ FAILED:", e);
  process.exit(1);
});
