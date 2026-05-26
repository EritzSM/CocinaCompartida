import { Stagehand } from "@browserbasehq/stagehand";
import "./env.js";

export function createStagehandGroq() {
  const geminiKey = process.env.GEMINI_API_KEY ?? "";
  const groqKey = process.env.GROQ_API_KEY ?? "";

  // Prefer Gemini (1M TPM, no 90s waits) over Groq (8K TPM)
  const useGemini = geminiKey && !geminiKey.startsWith("AIzaSy_PEGA");
  const key = useGemini ? geminiKey : groqKey;
  const modelName = useGemini
    ? (process.env.GEMINI_MODEL ?? "google/gemini-2.0-flash")
    : `groq/${process.env.GROQ_MODEL ?? "openai/gpt-oss-20b"}`;

  if (!key) {
    throw new Error(
      "Falta API key en stagehand/.env — añade GEMINI_API_KEY o GROQ_API_KEY"
    );
  }

  return new Stagehand({
    env: "LOCAL",
    model: { modelName, apiKey: key },
    localBrowserLaunchOptions: {
      headless: process.env.HEADLESS === "true",
      args: [
        "--disable-features=Translate,PasswordManager,AutofillServerCommunication,PasswordLeakDetection",
        "--disable-save-password-bubble",
        "--no-default-browser-check",
        "--disable-blink-features=AutomationControlled",
        "--lang=es-CO",
      ],
    },
    verbose: 1,
    serverCache: true,
  });
}
