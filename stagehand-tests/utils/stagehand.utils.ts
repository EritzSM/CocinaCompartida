import "dotenv/config";
import { Stagehand } from "@browserbasehq/stagehand";
import { GeminiClient } from "./gemini.client.js";
import { OllamaClient } from "./ollama.client.js";

/**
 * Crea e inicializa una instancia de Stagehand.
 *
 * Prioridad del proveedor de IA:
 *   1. GROQ_API_KEY    → usa Groq (ultrarrápido, gratis, compatible con OpenAI)
 *   2. GEMINI_API_KEY  → usa Gemini via Google AI Studio
 *   3. OLLAMA_MODEL    → usa un modelo local de Ollama
 */
export async function createStagehand(): Promise<Stagehand> {
  const githubKey = process.env.GITHUB_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const ollamaModel = process.env.OLLAMA_MODEL;

  if (githubKey && githubKey.startsWith("ghp_")) {
    process.env.OPENAI_API_KEY = githubKey;
    process.env.OPENAI_BASE_URL = "https://models.inference.ai.azure.com";
    
    const stagehand = new Stagehand({
      env: "LOCAL",
      modelName: process.env.GITHUB_MODEL ?? "gpt-4o",
      modelClientOptions: {
        apiKey: githubKey,
        baseURL: process.env.OPENAI_BASE_URL,
      },
      verbose: 1,
    });
    await stagehand.init();
    
    stagehand.page.setDefaultTimeout(120000);
    stagehand.page.setDefaultNavigationTimeout(120000);
    return stagehand;
  }

  if (openRouterKey) {
    const stagehand = new Stagehand({
      env: "LOCAL",
      llmClient: new OllamaClient({
        serverModelName: process.env.OPENROUTER_MODEL ?? "google/gemini-2.0-flash-lite-preview-02-05:free",
        stagehandModelName: "gpt-4o",
        serverUrl: "https://openrouter.ai/api",
        apiKey: openRouterKey,
      }),
      verbose: 1,
    });
    await stagehand.init();
    
    stagehand.page.setDefaultTimeout(120000);
    stagehand.page.setDefaultNavigationTimeout(120000);
    return stagehand;
  }

  if (groqKey) {
    // Groq usa la misma API compatible con OpenAI que usa Ollama
    const stagehand = new Stagehand({
      env: "LOCAL",
      llmClient: new OllamaClient({
        serverModelName: process.env.GROQ_MODEL ?? "llama-3.1-8b-instant",
        stagehandModelName: "o1-preview",
        serverUrl: "https://api.groq.com/openai",
        apiKey: groqKey,
      }),
      verbose: 1,
      debugDom: false,
    });
    await stagehand.init();
    return stagehand;
  }

  if (geminiKey) {
    // GeminiClient dedicado — maneja el formato correcto para Google AI Studio
    const stagehand = new Stagehand({
      env: "LOCAL",
      llmClient: new GeminiClient(geminiKey),
      verbose: 1,
      debugDom: false,
    });
    await stagehand.init();
    return stagehand;
  }

  if (ollamaModel) {
    const ollamaUrl = process.env.OLLAMA_URL ?? "http://localhost:11434";
    const stagehand = new Stagehand({
      env: "LOCAL",
      llmClient: new OllamaClient({
        serverModelName: ollamaModel,
        stagehandModelName: "o1-preview",
        serverUrl: ollamaUrl,
        apiKey: process.env.OLLAMA_API_KEY,
      }),
      verbose: 1,
    });
    await stagehand.init();
    
    // Aumentar timeout a 2 minutos para dar tiempo a los modelos locales (Ollama)
    stagehand.page.setDefaultTimeout(120000);
    stagehand.page.setDefaultNavigationTimeout(120000);
    
    return stagehand;
  }

  throw new Error(
    "\n❌ No hay proveedor de IA configurado.\n" +
    "   Opción A (Recomendada): Añade GROQ_API_KEY en el .env (Gratis y rápido en console.groq.com)\n" +
    "   Opción B: Añade GEMINI_API_KEY en el .env\n" +
    "   Opción C: Añade OLLAMA_MODEL en el .env (ej: OLLAMA_MODEL=phi3:mini)"
  );
}

export const BASE_URL = process.env.APP_BASE_URL ?? "http://localhost";

export const TEST_CREDENTIALS = {
  email: process.env.TEST_USER_EMAIL ?? "testuser@example.com",
  password: process.env.TEST_USER_PASSWORD ?? "TestPassword123!",
  name: process.env.TEST_USER_NAME ?? "TestUser",
};

/** Logger con colores en consola */
export function log(status: "PASS" | "FAIL" | "INFO", message: string) {
  const color =
    status === "PASS" ? "\x1b[32m" : status === "FAIL" ? "\x1b[31m" : "\x1b[36m";
  console.log(`${color}[${status}]\x1b[0m ${message}`);
}

/**
 * Ejecuta un test usando el browser compartido `sh`.
 * El browser NO se cierra aquí — el llamador es responsable de sh.close().
 */
export async function runTest(
  name: string,
  testFn: (sh: Stagehand) => Promise<void>,
  sh: Stagehand
): Promise<boolean> {
  log("INFO", `▶ ${name}`);
  try {
    await testFn(sh);
    log("PASS", name);
    return true;
  } catch (err) {
    log("FAIL", `${name}\n         → ${(err as Error).message}`);
    return false;
  }
}
