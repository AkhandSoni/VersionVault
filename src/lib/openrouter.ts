// ============================================================
// VersionVault — OpenRouter AI Gateway Client
// SERVER ONLY. Never import in Client Components.
// See SECURITY.md §27-29 for AI safety requirements.
// ============================================================

import { getServerConfig } from './config';

export type OpenRouterMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type OpenRouterResponse = {
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
 * Send a chat completion request to OpenRouter.
 * The model is configured via OPENROUTER_MODEL env var — never hard-coded.
 * Throws if the request fails or the response is malformed.
 */
export async function openRouterChat(
  messages: OpenRouterMessage[],
  options?: {
    maxTokens?: number;
    temperature?: number;
  },
): Promise<string> {
  const { openRouterApiKey, openRouterModel } = getServerConfig();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      'X-Title': 'VersionVault',
    },
    body: JSON.stringify({
      model: openRouterModel,
      messages,
      max_tokens: options?.maxTokens ?? 1024,
      temperature: options?.temperature ?? 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as OpenRouterResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenRouter returned an empty response');
  }

  return content;
}
