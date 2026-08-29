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

// ----------------------------------------------------------------
// Server-only — never expose to browser
// Call requireEnv() only on the server (Route Handlers, Server Actions)
// ----------------------------------------------------------------
export function getServerConfig() {
  return {
    supabaseServiceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    openRouterApiKey: requireEnv('OPENROUTER_API_KEY'),
    openRouterModel: requireEnv('OPENROUTER_MODEL'),
    redisUrl: process.env.REDIS_URL, // optional — only if queue is enabled
  };
}
