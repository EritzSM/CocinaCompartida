/**
 * gemini.client.ts
 * Cliente de Gemini para Stagehand usando el endpoint OpenAI-compatible de Google AI Studio.
 *
 * Diferencias clave vs OllamaClient:
 *  - NO envía: frequency_penalty, presence_penalty, functions, function_call
 *  - USA el formato moderno: tools / tool_choice
 *  - Maneja correctamente las respuestas de Gemini
 */

import {
  LLMClient,
  type AvailableModel,
  type CreateChatCompletionOptions,
  type LLMResponse,
} from "@browserbasehq/stagehand";
import zodToJsonSchema from "zod-to-json-schema";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";
// gemini-2.0-flash-lite tiene la cuota gratuita más generosa
// Configurable con la variable GEMINI_MODEL en el .env
const DEFAULT_MODEL = "gemini-2.0-flash-lite";

export class GeminiClient extends LLMClient {
  type = "gemini";
  hasVision = true;

  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    super("claude-3-5-sonnet-latest" as AvailableModel); // nombre interno requerido por Stagehand
    this.apiKey = apiKey;
    this.model = model ?? process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
    console.log(`\x1b[36m[gemini]\x1b[0m Usando modelo: ${this.model}`);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private maybeString(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
  }

  private normalizeContent(content: unknown): string {
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "text" in item) return (item as any).text;
          return "";
        })
        .join(" ");
    }
    return content ? JSON.stringify(content) : "";
  }

  private normalizeMessage(msg: any): any {
    return {
      role: msg.role === "system" ? "system" : msg.role,
      content: typeof msg.content === "string"
        ? msg.content
        : this.normalizeContent(msg.content),
    };
  }

  // ── Construcción del cuerpo de la petición ──────────────────────────────────

  private buildRequestBody(options: CreateChatCompletionOptions["options"]): Record<string, unknown> {
    const messages = options.messages.map((m: any) => this.normalizeMessage(m));

    // Si hay response_model, agregar instrucción al sistema para devolver JSON
    if (options.response_model) {
      const schema = JSON.stringify(zodToJsonSchema(options.response_model.schema));
      messages.push({
        role: "user",
        content:
          `Responde ÚNICAMENTE con un objeto JSON válido que cumpla este esquema (sin markdown, sin explicación):\n${schema}`,
      });
    }

    // Si hay tools, agregar instrucción para seleccionar la herramienta correcta
    if (options.tools?.length) {
      const toolsJson = JSON.stringify(options.tools, null, 2);
      messages.push({
        role: "user",
        content:
          `Tienes disponibles estas herramientas:\n${toolsJson}\n\n` +
          `Responde con un JSON: { "name": "<nombre_herramienta>", "arguments": { ... } }`,
      });
    }

    const body: Record<string, unknown> = {
      model: this.model,
      messages,
      temperature: options.temperature ?? 0.1,
      max_tokens: options.maxTokens ?? 4096,
    };

    return body;
  }

  // ── Transformación de respuesta ──────────────────────────────────────────────

  private transformResponse(data: any): LLMResponse {
    const id = this.maybeString(data.id) ?? `gemini-${Date.now()}`;
    const choices = (data.choices ?? []).map((choice: any, idx: number) => {
      const msg = choice.message ?? {};
      return {
        index: choice.index ?? idx,
        message: {
          role: this.maybeString(msg.role) ?? "assistant",
          content: this.normalizeContent(msg.content ?? ""),
          tool_calls: [],
        },
        finish_reason: this.maybeString(choice.finish_reason) ?? "stop",
      };
    });

    return {
      id,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: this.model,
      choices,
      usage: {
        prompt_tokens: data.usage?.prompt_tokens ?? 0,
        completion_tokens: data.usage?.completion_tokens ?? 0,
        total_tokens: data.usage?.total_tokens ?? 0,
      },
    };
  }

  // ── Extracción de JSON de la respuesta de texto ──────────────────────────────

  private extractJson(text: string): unknown | null {
    // Limpiar markdown code blocks si existen
    const stripped = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    try {
      return JSON.parse(stripped);
    } catch {
      // Buscar el primer objeto JSON válido en el texto
      const match = stripped.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  // ── Método principal ─────────────────────────────────────────────────────────

  async createChatCompletion<T = LLMResponse>({
    options,
    logger,
  }: CreateChatCompletionOptions): Promise<T> {
    logger({
      category: "gemini",
      message: "enviando petición a Gemini",
      level: 1,
      auxiliary: {
        model: { value: this.model, type: "string" },
        requestId: { value: options.requestId, type: "string" },
      },
    });

    const body = this.buildRequestBody(options);
    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const response = await fetch(`${GEMINI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      // Rate limit — esperar el tiempo que indica la API y reintentar
      if (response.status === 429) {
        const text = await response.text();

        // Extraer el retryDelay de la respuesta JSON de Gemini
        let waitMs = 35_000; // valor por defecto: 35 segundos
        try {
          const parsed = JSON.parse(text);
          const violations = parsed?.[0]?.error?.details ?? parsed?.error?.details ?? [];
          const retryInfo = violations.find((d: any) => d["@type"]?.includes("RetryInfo"));
          if (retryInfo?.retryDelay) {
            // retryDelay viene como "31s" o "31.7s"
            const seconds = parseFloat(retryInfo.retryDelay.replace("s", ""));
            if (!isNaN(seconds)) waitMs = Math.ceil(seconds * 1000) + 2000;
          }
        } catch { /* usa el valor por defecto */ }

        if (attempt < MAX_RETRIES) {
          const waitSec = (waitMs / 1000).toFixed(0);
          logger({
            category: "gemini",
            message: `Rate limit (429) — esperando ${waitSec}s antes de reintentar (intento ${attempt}/${MAX_RETRIES})`,
            level: 1,
            auxiliary: {
              waitMs: { value: waitMs.toString(), type: "string" },
            },
          });
          console.log(`\x1b[33m[gemini]\x1b[0m Rate limit — esperando ${waitSec}s...`);
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }

        throw new Error(`Gemini rate limit (429) tras ${MAX_RETRIES} intentos. Espera un minuto y vuelve a correr los tests.`);
      }

      if (!response.ok) {
        const text = await response.text();
        logger({
          category: "gemini",
          message: "error en la petición",
          level: 2,
          auxiliary: {
            status: { value: response.status.toString(), type: "string" },
            body: { value: text, type: "string" },
          },
        });
        throw new Error(`Gemini API error ${response.status}: ${text}`);
      }

      const data = await response.json();
      const transformed = this.transformResponse(data);

      logger({
        category: "gemini",
        message: "respuesta recibida",
        level: 1,
        auxiliary: { requestId: { value: options.requestId, type: "string" } },
      });

      // Si hay response_model, parsear el JSON de la respuesta de texto
      if (options.response_model) {
        const text = transformed.choices[0]?.message.content ?? "";
        const parsed = this.extractJson(text);
        if (parsed !== null) {
          return parsed as unknown as T;
        }
        throw new Error(`Gemini no devolvió JSON válido. Respuesta: "${text}"`);
      }

      // Si hay tools, parsear la selección de herramienta
      if (options.tools?.length) {
        const text = transformed.choices[0]?.message.content ?? "";
        const parsed = this.extractJson(text);
        if (parsed && typeof parsed === "object" && "name" in parsed) {
          const toolCall = parsed as { name: string; arguments: unknown };
          return {
            ...transformed,
            choices: [
              {
                ...transformed.choices[0],
                message: {
                  ...transformed.choices[0].message,
                  tool_calls: [
                    {
                      id: `call_${Date.now()}`,
                      type: "function",
                      function: {
                        name: toolCall.name,
                        arguments: JSON.stringify(toolCall.arguments ?? {}),
                      },
                    },
                  ],
                },
              },
            ],
          } as unknown as T;
        }
      }

      return transformed as unknown as T;
    }

    throw new Error("Gemini: se agotaron los reintentos.");
  }
}
