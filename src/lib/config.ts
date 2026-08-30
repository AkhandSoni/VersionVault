// ============================================================
// VersionVault — App Configuration
// Validates required env vars at startup.
// All secrets are server-side only.
// ============================================================

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Copy .env.example to .env.local and fill in the values.`,
    );
  }
  return value;
}

// ----------------------------------------------------------------
// Public (safe for browser)
// ----------------------------------------------------------------
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** Keep OAuth continuation URLs on this application origin. */
export function getSafeAppRedirect(value: string | null | undefined, fallback = '/dashboard'): URL {
  const appUrl = new URL(APP_URL);
  const fallbackUrl = new URL(fallback, appUrl);

  if (!value || value.startsWith('//')) return fallbackUrl;

  try {
    const candidate = new URL(value, appUrl);
    if (candidate.origin !== appUrl.origin) return fallbackUrl;
    return candidate;
  } catch {
    return fallbackUrl;
  }
}

// ----------------------------------------------------------------
// Server-only — never expose to browser
// Call requireEnv() only on the server (Route Handlers, Server Actions)
// ----------------------------------------------------------------
export function getServerConfig() {
  return {
    supabaseServiceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    groqApiKey: requireEnv('GROQ_API_KEY'),
    groqModel: process.env.GROQ_MODEL ?? 'openai/gpt-oss-20b',
    redisUrl: process.env.REDIS_URL, // optional — only if queue is enabled
  };
}
