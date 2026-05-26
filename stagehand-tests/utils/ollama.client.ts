import { LLMClient, type AvailableModel, type ClientOptions, type CreateChatCompletionOptions, type LLMResponse } from "@browserbasehq/stagehand";
import zodToJsonSchema from "zod-to-json-schema";

export interface OllamaClientOptions {
  serverModelName: string;
  stagehandModelName?: AvailableModel;
  serverUrl: string;
  apiKey?: string;
}

export class OllamaClient extends LLMClient {
  type = "ollama";
  hasVision = false;
  clientOptions: ClientOptions;
  serverUrl: string;
  apiKey?: string;
  serverModelName: string;

  constructor({ serverModelName, stagehandModelName = "o1-preview", serverUrl, apiKey }: OllamaClientOptions, userProvidedInstructions?: string) {
    super(stagehandModelName, userProvidedInstructions);
    this.serverUrl = serverUrl.replace(/\/+$/, "");
    this.apiKey = apiKey;
    this.clientOptions = { baseURL: this.serverUrl, apiKey: apiKey ?? "" } as ClientOptions;
    this.serverModelName = serverModelName;
    this.modelName = stagehandModelName;
  }

  private maybeString(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
  }

  private normalizeMessageContent(content: unknown): string {
    if (typeof content === "string") {
      return content;
    }
    if (Array.isArray(content)) {
      return content
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }
          if (item && typeof item === "object") {
            if ("text" in item && typeof item.text === "string") {
              return item.text;
            }
            if ("image_url" in item && item.image_url && typeof item.image_url.url === "string") {
              return `[IMAGE: ${item.image_url.url}]`;
            }
            return JSON.stringify(item);
          }
          return "";
        })
        .join(" ");
    }
    if (content && typeof content === "object") {
      return JSON.stringify(content);
    }
    return "";
  }

  private getRequestId(): string {
    const uuid = typeof globalThis.crypto !== "undefined" && typeof (globalThis.crypto as any).randomUUID === "function"
      ? (globalThis.crypto as any).randomUUID()
      : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    return uuid;
  }

  private normalizeContentItem(item: any): string | { type: string; text: string } | { type: "image_url"; image_url: { url: string }; text?: string } {
    if (typeof item === "string") {
      return item;
    }
    if (item && typeof item === "object") {
      if (item.type === "image_url" && item.image_url && typeof item.image_url.url === "string") {
        return {
          type: "image_url",
          image_url: {
            url: item.image_url.url
          },
          text: typeof item.text === "string" ? item.text : undefined
        };
      }
      if (typeof item.text === "string") {
        return {
          type: "text",
          text: item.text
        };
      }
      return JSON.stringify(item);
    }
    return "";
  }

  private normalizeMessage(message: any) {
    if (typeof message.content === "string") {
      return {
        role: message.role,
        content: message.content
      };
    }

    if (Array.isArray(message.content)) {
      return {
        role: message.role,
        content: message.content.map((item: any) => this.normalizeContentItem(item))
      };
    }

    return {
      role: message.role,
      content: this.maybeString(message.content) ?? JSON.stringify(message.content ?? "")
    };
  }

  private buildFunctionDefinitions(options: CreateChatCompletionOptions): any[] | undefined {
    if (!Array.isArray(options.options.tools)) {
      return undefined;
    }

    return options.options.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
  }

  private makeOllamaMessages({ options }: CreateChatCompletionOptions): any[] {
    let messages = options.messages.map((message: any) => this.normalizeMessage(message));

    if (this.modelName.startsWith("o1") || this.modelName.startsWith("o3")) {
      messages = messages.map((message) => ({
        ...message,
        role: message.role === "system" ? "system" : "user"
      }));

      if (options.tools) {
        messages.push({
          role: "user",
          content: `You have the following tools available to you:\n${JSON.stringify(options.tools, null, 2)}\n\nRespond with the following zod schema format to use a method: { "name": "<tool_name>", "arguments": <tool_args> }\nDo not include any other text, formatting, or markdown in your response. Only the JSON object itself.`
        });
      }

      if (options.response_model) {
        const schemaJson = JSON.stringify(zodToJsonSchema(options.response_model.schema));
        messages.push({
          role: "user",
          content: `Respond in this zod schema format:\n${schemaJson}\n\nDo not include any other text, formatting or markdown in your output. Do not include \`\`\` or \`\`\`json in your response. Only the JSON object itself.`
        });
      }
    } else if (options.response_model) {
      messages.push({
        role: "system",
        content: "IMPORTANT: Your response must be valid JSON and return the extracted data according to the schema provided. Do not wrap it in markdown code blocks. Return only the JSON object."
      });
    }

    return messages;
  }

  private transformResponse(data: any): LLMResponse {
    const choices = Array.isArray(data.choices)
      ? data.choices.map((choice: any, index: number) => {
          const message = choice.message || choice;
          const toolCalls: any[] = [];

          if (Array.isArray(message.tool_calls)) {
            toolCalls.push(
              ...message.tool_calls.map((toolCall: any) => ({
                id: this.maybeString(toolCall.id) ?? "",
                type: this.maybeString(toolCall.type) ?? "function",
                function: {
                  name: this.maybeString(toolCall.function?.name) ?? "",
                  arguments: this.maybeString(toolCall.function?.arguments) ?? JSON.stringify(toolCall.function?.arguments ?? {})
                }
              }))
            );
          }

          if (message.function_call && typeof message.function_call === "object") {
            toolCalls.push({
              id: this.maybeString(message.function_call.id) ?? this.getRequestId(),
              type: "function",
              function: {
                name: this.maybeString(message.function_call.name) ?? "",
                arguments: this.maybeString(message.function_call.arguments) ?? JSON.stringify(message.function_call.arguments ?? {})
              }
            });
          }

          return {
            index: choice.index ?? index,
            message: {
              role: this.maybeString(message.role) ?? "assistant",
              content: this.normalizeMessageContent(message.content ?? null),
              tool_calls: toolCalls
            },
            finish_reason: this.maybeString(choice.finish_reason) ?? "stop"
          };
        })
      : [];

    return {
      id: this.maybeString(data.id) ?? this.getRequestId(),
      object: this.maybeString(data.object) ?? "chat.completion",
      created: typeof data.created === "number" ? data.created : Math.floor(Date.now() / 1e3),
      model: this.maybeString(data.model) ?? this.modelName,
      choices,
      usage: {
        prompt_tokens: typeof data.usage?.prompt_tokens === "number" ? data.usage.prompt_tokens : 0,
        completion_tokens: typeof data.usage?.completion_tokens === "number" ? data.usage.completion_tokens : 0,
        total_tokens: typeof data.usage?.total_tokens === "number" ? data.usage.total_tokens : 0
      }
    };
  }

  async createChatCompletion<T = LLMResponse>({ options, logger, retries }: CreateChatCompletionOptions): Promise<T> {
    logger({
      category: "ollama",
      message: "creating chat completion",
      level: 1,
      auxiliary: {
        modelName: {
          value: this.modelName,
          type: "string"
        },
        requestId: {
          value: options.requestId,
          type: "string"
        }
      }
    });

    const formattedMessages = options.messages.map((message: any) => this.normalizeMessage(message));
    formattedMessages.push({
      role: "system",
      content: "IMPORTANT: Your response must be valid JSON and, when using a response model, return the extracted data via a function call according to the schema provided by the caller."
    });

    const body: Record<string, unknown> = {
      model: this.serverModelName,
      messages: formattedMessages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 8192,
      response_format: { type: "json_object" }
    };

    if (typeof options.top_p === "number") {
      body.top_p = options.top_p;
    }
    if (typeof options.frequency_penalty === "number") {
      body.frequency_penalty = options.frequency_penalty;
    }
    if (typeof options.presence_penalty === "number") {
      body.presence_penalty = options.presence_penalty;
    }

    const tools = options.tools?.map((tool: any) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));

    if (tools && tools.length > 0) {
      body.tools = tools;
    }

    if (options.tool_choice) {
      if (typeof options.tool_choice === "string" && options.tool_choice !== "auto" && options.tool_choice !== "none") {
         body.tool_choice = { type: "function", function: { name: options.tool_choice } };
      } else {
         body.tool_choice = options.tool_choice;
      }
    }

    const maxAttempts = (retries ?? 0) + 1;
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const url = this.serverUrl.endsWith("/chat/completions") 
          ? this.serverUrl 
          : `${this.serverUrl}/v1/chat/completions`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
          },
          body: JSON.stringify(body),
          keepalive: true,
        });

        if (!response.ok) {
          const text = await response.text();
          if (response.status === 429) {
            const waitMatch = text.match(/wait (\d+) seconds/i);
            const waitSecs = waitMatch ? parseInt(waitMatch[1], 10) + 2 : 15;
            logger({
              category: "ollama",
              message: `Rate limited (429). Waiting ${waitSecs}s before retrying...`,
              level: 1,
            });
            await new Promise(r => setTimeout(r, waitSecs * 1000));
            maxAttempts++; // Give it another chance
            continue;
          }
          
          logger({
            category: "ollama",
            message: "request failed",
            level: 2,
            auxiliary: {
              status: { value: response.status.toString(), type: "string" },
              body: { value: text, type: "string" }
            }
          });
          throw new Error(`Ollama API error: ${response.status} ${text}`);
        }

        const data = await response.json();
        const transformed = this.transformResponse(data);

        logger({
          category: "ollama",
          message: "response received",
          level: 1,
          auxiliary: {
            response: {
              value: JSON.stringify(transformed),
              type: "object"
            },
            requestId: {
              value: options.requestId,
              type: "string"
            }
          }
        });

        const toolCall = transformed.choices[0]?.message.tool_calls?.[0];
        if (options.response_model && toolCall?.function?.arguments) {
          try {
            const parsed = JSON.parse(toolCall.function.arguments);
            return parsed as unknown as T;
          } catch (error) {
            logger({
              category: "ollama",
              message: "failed to parse function call arguments as JSON",
              level: 2,
              auxiliary: {
                error: {
                  value: String(error),
                  type: "string"
                },
                arguments: {
                  value: this.maybeString(toolCall.function.arguments) ?? "",
                  type: "string"
                }
              }
            });
          }
        }

        if (options.response_model) {
          const assistantText = transformed.choices[0]?.message.content;
          if (typeof assistantText === "string") {
            try {
              // Try to extract JSON from markdown code blocks (```json ... ```)
              const jsonMatch = assistantText.match(/```json\s*([\s\S]*?)\s*```/) || 
                               assistantText.match(/```\s*([\s\S]*?)\s*```/);
              const jsonText = jsonMatch ? jsonMatch[1] : assistantText;
              const parsed = JSON.parse(jsonText);
              return parsed as unknown as T;
            } catch (error) {
              logger({
                category: "ollama",
                message: "failed to extract JSON from response",
                level: 2,
                auxiliary: {
                  error: {
                    value: String(error),
                    type: "string"
                  },
                  content: {
                    value: assistantText,
                    type: "string"
                  }
                }
              });
              // fall back to returning the full response
            }
          }
        }

        return transformed as unknown as T;
      } catch (error) {
        lastError = error;
        if (attempt >= maxAttempts) {
          throw error;
        }
        logger({
          category: "ollama",
          message: `retrying request after failure (attempt ${attempt})`,
          level: 1,
          auxiliary: {
            error: {
              value: String(error),
              type: "string"
            }
          }
        });
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }

    throw lastError;
  }
}
