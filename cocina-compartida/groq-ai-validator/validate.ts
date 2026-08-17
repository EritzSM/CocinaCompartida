/**
 * Groq AI Validator — Herramienta de IA #2
 *
 * Usa el LLM Groq (llama-3.3-70b-versatile) para validar de forma inteligente
 * las respuestas de la API de CocinaCompartida para las 5 funcionalidades.
 *
 * Flujo por funcionalidad:
 *   1. Llama al endpoint de la API
 *   2. Envía la respuesta a Groq con una pregunta de validación
 *   3. Groq responde PASS/FAIL con razón
 *   4. Genera reporte JSON en evidencias/
 *
 * Ejecución: npm run groq:validate
 */

import Groq from 'groq-sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// ── Config ──────────────────────────────────────────────────────────────────
dotenv.config({ path: path.join(__dirname, '..', 'stagehand', '.env') });

const GROQ_API_KEY = process.env.GROQ_API_KEY ?? '';
// La API es accesible a través del proxy nginx en http://localhost (puerto 80)
// que re-enruta /api/* al backend. El API_URL del .env apunta al backend directo
// pero desde tests usamos el proxy igual que Cypress.
const BASE_URL     = process.env.FRONTEND_URL ?? 'http://localhost';
const TEST_EMAIL   = process.env.TEST_EMAIL ?? 'chef@cocinacompartida.com';
const TEST_PASS    = process.env.TEST_PASSWORD ?? 'password123';
const MODEL        = 'llama-3.3-70b-versatile';
const EVIDENCIAS_DIR = path.join(__dirname, '..', 'evidencias');

if (!GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY no encontrada en stagehand/.env');
  process.exit(1);
}

const groq = new Groq({ apiKey: GROQ_API_KEY });

// ── Types ────────────────────────────────────────────────────────────────────
interface ValidationResult {
  functionality:  string;
  testId:         string;
  endpoint:       string;
  httpStatus:     number;
  aiVerdict:      'PASS' | 'FAIL' | 'SKIP' | 'ERROR';
  aiReason:       string;
  timestamp:      string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
async function apiGet(path: string, token?: string): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function apiPost(path: string, data: any, token?: string): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST', headers, body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

/** Envía un fragmento de datos a Groq y obtiene veredicto PASS/FAIL */
async function askGroq(question: string, data: string): Promise<{ verdict: 'PASS' | 'FAIL' | 'ERROR'; reason: string }> {
  try {
    const prompt = `Eres un QA automático que valida respuestas de una API REST de cocina.
Debes responder SOLO con JSON válido, sin explicaciones adicionales.

CRITERIO DE VALIDACIÓN: ${question}

RESPUESTA DE LA API:
${data.substring(0, 600)}

INSTRUCCIONES:
- Si el criterio se cumple → {"verdict":"PASS","reason":"descripción breve en español"}
- Si el criterio NO se cumple → {"verdict":"FAIL","reason":"descripción breve en español"}
- Sé estrictamente objetivo. No inventes campos ni compares con estándares no mencionados.
- Responde ÚNICAMENTE el JSON, nada más.`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.0,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? '';
    // Extraer JSON de la respuesta
    const match = raw.match(/\{[^}]+\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return { verdict: parsed.verdict === 'PASS' ? 'PASS' : 'FAIL', reason: parsed.reason };
    }
    // Si la respuesta menciona PASS sin JSON
    if (raw.toUpperCase().includes('PASS')) return { verdict: 'PASS', reason: raw.substring(0, 150) };
    return { verdict: 'FAIL', reason: raw.substring(0, 150) };
  } catch (err: any) {
    return { verdict: 'ERROR', reason: `Groq API error: ${err.message}` };
  }
}

// ── Login ────────────────────────────────────────────────────────────────────
async function getToken(): Promise<string> {
  const res = await apiPost('/api/auth/login', { email: TEST_EMAIL, password: TEST_PASS });
  if (res.status !== 200 && res.status !== 201) throw new Error(`Login falló: ${res.status}`);
  return res.body.token as string;
}

// ════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('\n🤖 GROQ AI VALIDATOR — CocinaCompartida');
  console.log('='.repeat(55));
  console.log(`📡 API:   ${BASE_URL}`);
  console.log(`🧠 Modelo: ${MODEL}\n`);

  const results: ValidationResult[] = [];

  // ── Obtener token ──────────────────────────────────────────────────────────
  let token = '';
  try {
    token = await getToken();
    console.log('🔑 Login ✓ — token JWT obtenido\n');
  } catch (err: any) {
    console.error(`❌ No se pudo hacer login: ${err.message}`);
    process.exit(1);
  }

  // ── F1: Explore — Listado de recetas ─────────────────────────────────────
  console.log('── F1: Explore — Listado de recetas ──────────────────');
  await sleep(500);
  const f1 = await apiGet('/api/recipes');
  const first2 = Array.isArray(f1.body) ? f1.body.slice(0, 2) : f1.body;
  const f1Keys = Array.isArray(f1.body) && f1.body.length > 0 ? Object.keys(f1.body[0]).join(', ') : '';
  const f1ai = await askGroq(
    `La API devolvió HTTP ${f1.status} con un array de ${Array.isArray(f1.body) ? f1.body.length : 0} elementos. El primer elemento tiene los campos: ${f1Keys}. ¿El array es válido (no vacío, HTTP 200, cada elemento tiene los campos 'id' y 'name')?`,
    `HTTP ${f1.status}, array length=${Array.isArray(f1.body) ? f1.body.length : 0}\nPrimer elemento: ${JSON.stringify(first2[0] ?? {}).substring(0, 300)}`
  );
  results.push({
    functionality: 'F1 — Explore',
    testId: 'AI-F1-1',
    endpoint: 'GET /api/recipes',
    httpStatus: f1.status,
    aiVerdict: f1.status === 200 && Array.isArray(f1.body) ? f1ai.verdict : 'FAIL',
    aiReason: f1ai.reason,
    timestamp: new Date().toISOString(),
  });
  console.log(`  [AI-F1-1] ${results.at(-1)!.aiVerdict} — ${f1ai.reason}`);

  await sleep(3000); // Groq rate limit

  // ── F2: Recipe Detail ─────────────────────────────────────────────────────
  console.log('\n── F2: Recipe Detail ─────────────────────────────────');
  let firstId = '';
  if (Array.isArray(f1.body) && f1.body.length > 0) firstId = f1.body[0].id;

  if (firstId) {
    const f2 = await apiGet(`/api/recipes/${firstId}`);
    const f2Keys = Object.keys(f2.body ?? {}).join(', ');
    const f2ai = await askGroq(
      `Criterio PASS: HTTP 200, tiene campos 'id', 'name', 'user' (objeto con datos del autor), 'ingredients' (array), 'steps' (array). La respuesta tiene HTTP ${f2.status} y campos: ${f2Keys}. ¿Cumple todos los criterios?`,
      `HTTP ${f2.status}\nCampos presentes: ${f2Keys}\nUser: ${JSON.stringify(f2.body?.user ?? {})}\nIngredients es array: ${Array.isArray(f2.body?.ingredients)}, Steps es array: ${Array.isArray(f2.body?.steps)}`
    );
    results.push({
      functionality: 'F2 — Recipe Detail',
      testId: 'AI-F2-1',
      endpoint: `GET /api/recipes/${firstId}`,
      httpStatus: f2.status,
      aiVerdict: f2.status === 200 ? f2ai.verdict : 'FAIL',
      aiReason: f2ai.reason,
      timestamp: new Date().toISOString(),
    });
    console.log(`  [AI-F2-1] ${results.at(-1)!.aiVerdict} — ${f2ai.reason}`);
  } else {
    results.push({ functionality: 'F2 — Recipe Detail', testId: 'AI-F2-1', endpoint: 'GET /api/recipes/:id', httpStatus: 0, aiVerdict: 'SKIP', aiReason: 'Sin recetas en la base de datos', timestamp: new Date().toISOString() });
    console.log('  [AI-F2-1] SKIP — Sin recetas para detallar');
  }

  await sleep(3000);

  // ── F3: Backend CRUD ──────────────────────────────────────────────────────
  console.log('\n── F3: Backend CRUD — Create / Update / Delete ───────');
  const f3Create = await apiPost('/api/recipes', {
    name: `GROQ_TEST_${Date.now()}`,
    descripcion: 'Receta de prueba del validador Groq AI',
    ingredients: ['harina 200g', 'azúcar 100g'],
    steps: ['Mezclar ingredientes', 'Hornear 25 minutos'],
    category: 'postres', images: [],
  }, token);

  const f3ai = await askGroq(
    '¿Esta respuesta confirma que se creó correctamente una receta de cocina en la API?',
    `HTTP ${f3Create.status}\n${JSON.stringify(f3Create.body)}`
  );
  results.push({
    functionality: 'F3 — Backend CRUD',
    testId: 'AI-F3-1',
    endpoint: 'POST /api/recipes',
    httpStatus: f3Create.status,
    aiVerdict: [200, 201].includes(f3Create.status) ? f3ai.verdict : 'FAIL',
    aiReason: f3ai.reason,
    timestamp: new Date().toISOString(),
  });
  console.log(`  [AI-F3-1] ${results.at(-1)!.aiVerdict} — ${f3ai.reason}`);

  // Cleanup CRUD test recipe
  if (f3Create.body?.id) {
    await fetch(`${BASE_URL}/api/recipes/${f3Create.body.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  }

  await sleep(3000);

  // ── F4: Categories ────────────────────────────────────────────────────────
  console.log('\n── F4: Categories — Filtrado por categorías ──────────');
  const f4 = await apiGet('/api/recipes');
  const categories = Array.isArray(f4.body) ? [...new Set(f4.body.map((r: any) => r.category).filter(Boolean))] : [];
  const f4ai = await askGroq(
    `¿Las siguientes categorías son válidas y coherentes para una aplicación de recetas de cocina: ${categories.join(', ')}?`,
    `Categorías encontradas: ${categories.join(', ')}\nTotal recetas: ${Array.isArray(f4.body) ? f4.body.length : 0}`
  );
  results.push({
    functionality: 'F4 — Categories',
    testId: 'AI-F4-1',
    endpoint: 'GET /api/recipes (campo category)',
    httpStatus: f4.status,
    aiVerdict: f4.status === 200 ? f4ai.verdict : 'FAIL',
    aiReason: f4ai.reason,
    timestamp: new Date().toISOString(),
  });
  console.log(`  [AI-F4-1] ${results.at(-1)!.aiVerdict} — ${f4ai.reason}`);

  await sleep(3000);

  // ── F5: Favorites ─────────────────────────────────────────────────────────
  console.log('\n── F5: Favorites — Sistema de likes ─────────────────');
  if (firstId) {
    const f5 = await apiPost(`/api/recipes/${firstId}/like`, {}, token);
    const f5Likes = f5.body?.likes ?? f5.body?.recipe?.likes;
    const f5ai = await askGroq(
      `Endpoint de toggle likes. Criterio de PASS: HTTP 200 o 201, y campo 'likes' presente con valor numérico >= 0. La respuesta tuvo HTTP ${f5.status} y campo likes=${f5Likes}. ¿Cumple el criterio?`,
      `HTTP ${f5.status}\nCampos: ${Object.keys(f5.body ?? {}).join(', ')}\nLikes en respuesta: ${f5Likes}`
    );
    results.push({
      functionality: 'F5 — Favorites',
      testId: 'AI-F5-1',
      endpoint: `POST /api/recipes/${firstId}/like`,
      httpStatus: f5.status,
      aiVerdict: [200, 201].includes(f5.status) ? f5ai.verdict : 'FAIL',
      aiReason: f5ai.reason,
      timestamp: new Date().toISOString(),
    });
    console.log(`  [AI-F5-1] ${results.at(-1)!.aiVerdict} — ${f5ai.reason}`);
  } else {
    results.push({ functionality: 'F5 — Favorites', testId: 'AI-F5-1', endpoint: 'POST /api/recipes/:id/like', httpStatus: 0, aiVerdict: 'SKIP', aiReason: 'Sin recetas disponibles', timestamp: new Date().toISOString() });
    console.log('  [AI-F5-1] SKIP — Sin recetas disponibles');
  }

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(55));
  const passing = results.filter(r => r.aiVerdict === 'PASS').length;
  const failing = results.filter(r => r.aiVerdict === 'FAIL').length;
  const skipped = results.filter(r => r.aiVerdict === 'SKIP').length;
  const errors  = results.filter(r => r.aiVerdict === 'ERROR').length;

  console.log(`\n📊 RESULTADOS GROQ AI VALIDATOR`);
  console.log(`  ✅ PASS:  ${passing}`);
  console.log(`  ❌ FAIL:  ${failing}`);
  console.log(`  ⚠️  SKIP:  ${skipped}`);
  console.log(`  🔴 ERROR: ${errors}`);
  console.log(`  TOTAL:    ${results.length}`);

  // Tabla de resultados
  console.log('\n  TestID      Funcionalidad         Veredicto');
  console.log('  ' + '-'.repeat(50));
  results.forEach(r => {
    const icon = r.aiVerdict === 'PASS' ? '✅' : r.aiVerdict === 'SKIP' ? '⚠️' : '❌';
    console.log(`  ${r.testId.padEnd(12)} ${r.functionality.padEnd(25)} ${icon} ${r.aiVerdict}`);
  });

  // ── Guardar JSON ──────────────────────────────────────────────────────────
  if (!fs.existsSync(EVIDENCIAS_DIR)) fs.mkdirSync(EVIDENCIAS_DIR, { recursive: true });
  const outPath = path.join(EVIDENCIAS_DIR, 'groq-ai-validator-results.json');
  fs.writeFileSync(outPath, JSON.stringify({ summary: { passing, failing, skipped, errors, total: results.length }, results }, null, 2));
  console.log(`\n💾 Resultados guardados en: evidencias/groq-ai-validator-results.json\n`);
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
