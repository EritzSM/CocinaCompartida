import { Stagehand } from "@browserbasehq/stagehand";
import "./env.js";

export function createStagehandGroq() {
  const key = process.env.GROQ_API_KEY ?? "";
  if (!key || key.startsWith("gsk_PEGA")) {
    throw new Error(
      "Falta GROQ_API_KEY en stagehand/.env — obtén una gratis en https://console.groq.com/"
    );
  }

  return new Stagehand({
    env: "LOCAL",
    model: {
      modelName: `groq/${process.env.GROQ_MODEL ?? "openai/gpt-oss-20b"}`,
      apiKey: key,
    },
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
