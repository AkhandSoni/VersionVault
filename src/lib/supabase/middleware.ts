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
    corsHeaders['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Idempotency-Key';
    corsHeaders['Access-Control-Allow-Methods'] = 'GET, POST, PATCH, DELETE, OPTIONS';
  }

  if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    return withSecurityHeaders(new NextResponse(null, { status: 204, headers: corsHeaders }));
  }

  if (pathname.startsWith('/api/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) && origin && !allowedOrigins.has(origin)) {
    return withSecurityHeaders(NextResponse.json({ error: 'FORBIDDEN', message: 'Cross-origin request is not allowed' }, { status: 403 }));
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
    return withSecurityHeaders(NextResponse.redirect(url));
  }

  // Redirect authenticated users away from auth pages.
  const isAuthRoute = pathname === '/login' || pathname === '/register';
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return withSecurityHeaders(NextResponse.redirect(url));
  }

  Object.entries(corsHeaders).forEach(([key, value]) => {
    supabaseResponse.headers.set(key, value);
  });

  return withSecurityHeaders(supabaseResponse);
}

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Vary', 'Origin');
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  return response;
}
