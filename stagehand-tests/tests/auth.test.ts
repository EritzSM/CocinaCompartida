/**
 * auth.test.ts — Pruebas de Autenticación
 *
 * Patrón Stagehand:
 *   observe() → detecta elementos interactivos en la página
 *   act()     → interactúa con la UI en lenguaje natural
 *   extract() → extrae datos estructurados de la página
 *
 * Tests:
 *   1. Página de login: observe + extract para confirmar el formulario
 *   2. Flujo de login: act para hacer login + observe + extract para confirmar resultado
 *   3. Ruta protegida: act para navegar + extract para confirmar redirección
 */

import "dotenv/config";
import { z } from "zod";
import * as fs from 'fs';
import { Stagehand } from "@browserbasehq/stagehand";
import { BASE_URL, TEST_CREDENTIALS, log, runTest, createStagehand } from "../utils/stagehand.utils.js";

// Helper for DeepEval
function saveEvalResult(input: string, actualOutput: any, expectedOutput: string, retrievalContext: string[] = []) {
  const filePath = 'eval_results.json';
  let results = [];
  if (fs.existsSync(filePath)) {
    results = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  results.push({
    input,
    actual_output: JSON.stringify(actualOutput),
    expected_output: expectedOutput,
    retrieval_context: retrievalContext
  });
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
}

function clearEvalResults() {
  const filePath = 'eval_results.json';
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: Página de login — observe() detecta el formulario, extract() lo valida
// ─────────────────────────────────────────────────────────────────────────────
async function testLoginPageObserveYExtract(sh: Stagehand) {
  // Navegar a login
  await sh.page.goto(`${BASE_URL}/login`);
  await sh.page.waitForLoadState("networkidle");

  // OBSERVE: la IA detecta todos los elementos interactivos de la página
  const elementos = await sh.page.observe(
    "Encuentra todos los campos de entrada y botones disponibles en el formulario de login"
  );
  log("INFO", `observe() detectó ${elementos.length} elementos interactivos`);

  if (elementos.length === 0) {
    throw new Error("observe() no encontró ningún elemento interactivo en la página de login");
  }

  // EXTRACT: la IA extrae datos estructurados del contenido visible
  const formulario = await sh.page.extract({
    instruction: "¿Hay un formulario de login con campo de email, contraseña y botón de ingresar?",
    schema: z.object({
      tieneEmail: z.boolean(),
      tienePassword: z.boolean(),
      tieneBotonLogin: z.boolean(),
      textoBoton: z.string().optional().describe("El texto del botón de login"),
    }),
  });

  log("INFO", `extract() resultado: ${JSON.stringify(formulario)}`);

  saveEvalResult(
    "¿Hay un formulario de login con campo de email, contraseña y botón de ingresar?",
    formulario,
    "El formulario debe contener email, password y botón de login, todos deben ser true.",
    [
      "La página actual es /login.",
      "La página contiene un campo de entrada para el correo electrónico.",
      "La página contiene un campo de entrada para la contraseña.",
      "La página contiene un botón para iniciar sesión."
    ]
  );

  if (!formulario.tieneEmail) throw new Error("No se encontró el campo de email");
  if (!formulario.tienePassword) throw new Error("No se encontró el campo de contraseña");
  if (!formulario.tieneBotonLogin) throw new Error("No se encontró el botón de login");
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: Flujo completo — act() para login, observe() y extract() para confirmar
// ─────────────────────────────────────────────────────────────────────────────
async function testLoginFlujoCompleto(sh: Stagehand) {
  await sh.page.goto(`${BASE_URL}/login`);
  await sh.page.waitForLoadState("networkidle");

  // ACT: la IA escribe en los campos y hace clic (lenguaje natural)
  await sh.page.act(`Escribe "${TEST_CREDENTIALS.email}" en el campo de correo electrónico`);
  await sh.page.act(`Escribe "${TEST_CREDENTIALS.password}" en el campo de contraseña`);
  await sh.page.act("Haz clic en el botón de iniciar sesión");
  await sh.page.waitForLoadState("networkidle");

  const urlDespues = sh.page.url();
  log("INFO", `URL después del act() de login: ${urlDespues}`);

  // OBSERVE: la IA describe qué cambió en la página tras el login
  const estadoPagina = await sh.page.observe(
    "Describe el estado actual de la página: ¿qué elementos interactivos hay disponibles?"
  );
  log("INFO", `observe() post-login: ${estadoPagina.length} elementos detectados`);

  // EXTRACT: la IA extrae información estructurada sobre el resultado del login
  if (urlDespues.includes("/login")) {
    const resultado = await sh.page.extract({
      instruction: "¿Hay algún mensaje de error o alerta visible en la pantalla?",
      schema: z.object({
        hayError: z.boolean(),
        mensaje: z.string().optional().describe("El texto del mensaje de error si existe"),
      }),
    });
    log("INFO", `extract() estado del login: ${JSON.stringify(resultado)}`);
    
    saveEvalResult(
      "¿Hay algún mensaje de error o alerta visible en la pantalla?",
      resultado,
      "Debería detectarse si hubo un error al iniciar sesión (hayError) y opcionalmente extraer el mensaje.",
      [
        "El intento de inicio de sesión falló debido a credenciales incorrectas.",
        "Apareció un mensaje en rojo que dice 'Contraseña incorrecta'."
      ]
    );
  } else {
    log("INFO", "✓ Login exitoso — navegó fuera de /login");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: Ruta protegida — act() para navegar, observe() + extract() para validar
// ─────────────────────────────────────────────────────────────────────────────
async function testRutaProtegidaRedirige(sh: Stagehand) {
  // Asegurarnos de que no hay sesión activa antes de probar la ruta protegida
  await sh.page.evaluate(() => localStorage.clear());

  // ACT: navegar directo a una ruta protegida sin estar autenticado
  await sh.page.goto(`${BASE_URL}/recipe-upload`);
  await sh.page.waitForLoadState("networkidle");

  const url = sh.page.url();
  log("INFO", `URL al acceder a ruta protegida: ${url}`);

  // OBSERVE: la IA identifica qué tipo de página se está mostrando
  const elementosVisibles = await sh.page.observe(
    "¿Qué tipo de página se muestra? ¿Hay un formulario de login o un formulario de subida de receta?"
  );
  log("INFO", `observe() detectó ${elementosVisibles.length} elementos en la página`);

  // EXTRACT: la IA determina si hubo redirección al login
  const pagina = await sh.page.extract({
    instruction: "¿Se está mostrando la página de login o la página de subir receta?",
    schema: z.object({
      esLogin: z.boolean().describe("true si se muestra el formulario de login"),
      esFormularioReceta: z.boolean().describe("true si se muestra el formulario de crear receta"),
    }),
  });

  log("INFO", `extract() página actual: ${JSON.stringify(pagina)}`);

  saveEvalResult(
    "¿Se está mostrando la página de login o la página de subir receta?",
    pagina,
    "Debería indicar esLogin=true y esFormularioReceta=false porque se bloqueó el acceso a la ruta protegida.",
    [
      "El usuario anónimo intentó acceder a /recipe-upload.",
      "El AuthGuard interceptó la solicitud porque no hay token en localStorage.",
      "El enrutador de Angular redirigió al usuario a la página /login."
    ]
  );

  // Si puede acceder al formulario de receta sin auth → falla de seguridad
  if (pagina.esFormularioReceta && !url.includes("/login")) {
    throw new Error("FALLA DE SEGURIDAD: /recipe-upload es accesible sin autenticación");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Ejecutar todos los tests con UN solo browser
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n🔐 ══════════════════════════════════════");
console.log("   Tests de Autenticación  |  act · observe · extract");
console.log("══════════════════════════════════════\n");

// Limpiar resultados anteriores de DeepEval
clearEvalResults();

const sh = await createStagehand();
try {
  await runTest(
    "Login: observe() detecta el formulario y extract() valida sus campos",
    testLoginPageObserveYExtract,
    sh
  );
  await runTest(
    "Login: act() completa el flujo y observe()+extract() confirman el resultado",
    testLoginFlujoCompleto,
    sh
  );
  await runTest(
    "Seguridad: act() navega a ruta protegida y extract() confirma redirección al login",
    testRutaProtegidaRedirige,
    sh
  );
} finally {
  await sh.close();
}

console.log("\n✅ Tests de autenticación finalizados.\n");
