export interface GroqConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
}

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export const DEFAULT_AI_UNAVAILABLE_MSG =
  "AI is not accessible at this moment, kindly try again later";

/**
 * Groq AI Gateway Adapter.
 * Handles server-side communication with the Groq API.
 * Enforces strict timeouts, prompt isolation, and fail-safe error handling.
 */
export class GroqGateway {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private timeoutMs: number;

  constructor(config: GroqConfig = {}) {
    this.apiKey = config.apiKey || process.env.GROQ_API_KEY || "";
    this.baseUrl = config.baseUrl || "https://api.groq.com/openai/v1";
    this.model =
      config.model ||
      process.env.GROQ_MODEL ||
      "openai/gpt-oss-20b";
    this.timeoutMs = config.timeoutMs || 8000;
  }

  getModel(): string {
    return this.model;
  }

  /**
   * Generates a grounded AI completion using Groq.
   * If API key is missing, call fails, or times out, safely returns degraded result.
   */
  async generateCompletion(
    systemPrompt: string,
    userPrompt: string
  ): Promise<{ success: boolean; content?: string; error?: string }> {
    if (!this.apiKey) {
      return {
        success: false,
        error: DEFAULT_AI_UNAVAILABLE_MSG,
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2, // Low temperature for factual precision
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          error: DEFAULT_AI_UNAVAILABLE_MSG,
        };
      }

      const data = (await response.json()) as GroqChatResponse;
      const content = data?.choices?.[0]?.message?.content;

      if (!content) {
        return {
          success: false,
          error: DEFAULT_AI_UNAVAILABLE_MSG,
        };
      }

      return {
        success: true,
        content,
      };
    } catch {
      clearTimeout(timeoutId);
      return {
        success: false,
        error: DEFAULT_AI_UNAVAILABLE_MSG,
      };
    }
  }
}
