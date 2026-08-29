import { AIExplanationResult } from "../types/contracts.js";

export interface OpenRouterConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
}

export const DEFAULT_AI_UNAVAILABLE_MSG =
  "AI is not accessible at this moment, kindly try again later";

/**
 * OpenRouter AI Gateway Adapter.
 * Handles server-side communication with OpenRouter API.
 * Enforces strict timeouts, prompt isolation, and fail-safe error handling.
 */
export class OpenRouterGateway {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private timeoutMs: number;

  constructor(config: OpenRouterConfig = {}) {
    this.apiKey = config.apiKey || process.env.OPENROUTER_API_KEY || "";
    this.baseUrl = config.baseUrl || "https://openrouter.ai/api/v1";
    this.model =
      config.model ||
      process.env.OPENROUTER_MODEL ||
      "meta-llama/llama-3.1-70b-instruct";
    this.timeoutMs = config.timeoutMs || 8000;
  }

  getModel(): string {
    return this.model;
  }

  /**
   * Generates a grounded AI completion using OpenRouter.
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
          "HTTP-Referer": "https://versionvault.app",
          "X-Title": "VersionVault Document Intelligence",
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

      const data = (await response.json()) as any;
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
    } catch (err) {
      clearTimeout(timeoutId);
      return {
        success: false,
        error: DEFAULT_AI_UNAVAILABLE_MSG,
      };
    }
  }
}
