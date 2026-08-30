// ============================================================
// VersionVault — Groq AI Gateway Client
// SERVER ONLY. Never import in Client Components.
// ============================================================

import { getServerConfig } from './config';

export type GroqMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type GroqResponse = {
  id: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

/**
 * Send a chat completion request to Groq's OpenAI-compatible API.
 * The model is configured via GROQ_MODEL and the key is server-only.
 */
export async function groqChat(
  messages: GroqMessage[],
  options?: {
    maxTokens?: number;
    temperature?: number;
  },
): Promise<string> {
  const { groqApiKey, groqModel } = getServerConfig();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: groqModel,
        messages,
        max_tokens: Math.min(options?.maxTokens ?? 1024, 4096),
        temperature: options?.temperature ?? 0.2,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Groq request failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as GroqResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Groq returned an empty response');
    }

    return content;
  } finally {
    clearTimeout(timeoutId);
  }
}
