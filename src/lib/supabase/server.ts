// ============================================================
// VersionVault — Supabase Server Client
// Use in Server Components, Route Handlers, Server Actions.
// NEVER import this in Client Components.
// ============================================================

import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — cookie writes ignored.
            // The root proxy handles session refresh.
          }
        },
      },
    },
  );
}

// ----------------------------------------------------------------
// Service-role client — SERVER ONLY, never expose to browser.
// Use only for privileged operations that bypass RLS.
// ----------------------------------------------------------------
export async function createServiceClient() {
  // Never attach request cookies to the service client. The SSR client can
  // replace the Authorization header with the signed-in user's JWT, which
  // makes service-only tables (such as idempotency_keys) fail RLS checks.
  // This client is server-only and always authenticates with the service key.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const usesModernSecretKey = serviceKey.startsWith('sb_secret_');

  // Modern Supabase secret keys are not JWTs. Supabase rejects them when they
  // are sent as `Authorization: Bearer ...`; they must remain in `apikey`.
  // The SDK's normal REST/storage wrapper adds the key as a Bearer fallback,
  // so strip only that header for modern secret-key requests. Legacy JWT
  // service_role keys continue using the SDK defaults unchanged.
  const globalFetch = usesModernSecretKey
    ? async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      headers.delete('Authorization');
      return fetch(input, { ...init, headers });
    }
    : undefined;

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      global: globalFetch ? { fetch: globalFetch } : undefined,
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );
}
