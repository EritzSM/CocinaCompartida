/**
 * run-all.ts
 * Ejecuta todos los suites de Stagehand en secuencia
 */

import "dotenv/config";
import { log } from "../utils/stagehand.utils.js";

console.log("\n🐰 ══════════════════════════════════════════════");
console.log("   Cocina Compartida — Stagehand AI Test Suite");
console.log("   act() | observe() | extract()");
console.log("═════════════════════════════════════════════════\n");

const start = Date.now();

// Importar y correr cada suite en orden
await import("./auth.test.js");
await import("./recipes.test.js");
await import("./explore.test.js");

const elapsed = ((Date.now() - start) / 1000).toFixed(1);

console.log("═════════════════════════════════════════════════");
log("INFO", `Total time: ${elapsed}s`);
console.log("═════════════════════════════════════════════════\n");
