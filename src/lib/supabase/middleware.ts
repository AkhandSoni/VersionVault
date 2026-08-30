// ============================================================
// VersionVault — Supabase Middleware Client
// Refreshes the user session on every request.
// ============================================================

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;
  const origin = request.headers.get('origin');
  const allowedOrigins = new Set([
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VITE_APP_URL,
    process.env.VITE_API_ORIGIN,
    'http://localhost:5173',
    'http://localhost:5174',
  ].filter(Boolean));

  const corsHeaders: Record<string, string> = {};
  if (origin && allowedOrigins.has(origin) && pathname.startsWith('/api/')) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
    corsHeaders['Access-Control-Allow-Credentials'] = 'true';
    corsHeaders['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    corsHeaders['Access-Control-Allow-Methods'] = 'GET, POST, PATCH, DELETE, OPTIONS';
  }

  if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session — do not remove this call.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect app routes — redirect to /login if unauthenticated.
  const isAppRoute = pathname.startsWith('/dashboard') ||
    pathname.startsWith('/documents') ||
    pathname.startsWith('/activity') ||
    pathname.startsWith('/settings');

  if (isAppRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages.
  const isAuthRoute = pathname === '/login' || pathname === '/register';
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  Object.entries(corsHeaders).forEach(([key, value]) => {
    supabaseResponse.headers.set(key, value);
  });

  return supabaseResponse;
}
