// ============================================================
// VersionVault — Root request proxy
// Handles auth session refresh & route protection.
// ============================================================

import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { checkRateLimit } from '@/lib/rate-limit';

export async function proxy(request: NextRequest) {
  const rateLimit = getRateLimitForPath(request.nextUrl.pathname, request.method);
  if (rateLimit) {
    const clientKey = request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const result = checkRateLimit(`${rateLimit.name}:${clientKey}`, rateLimit.limit, 60_000);
    if (!result.allowed) {
      const response = NextResponse.json(
        { error: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
        { status: 429 },
      );
      response.headers.set('Retry-After', String(result.retryAfterSeconds));
      return response;
    }
  }
  return await updateSession(request);
}

function getRateLimitForPath(pathname: string, method: string): { name: string; limit: number } | null {
  if (pathname === '/api/v1/auth/login' || pathname === '/api/v1/auth/register' || pathname === '/api/v1/auth/google') {
    return { name: 'auth', limit: 20 };
  }
  if (pathname.endsWith('/qa') || pathname.endsWith('/proposals') || pathname.includes('/proposals/')) {
    return { name: 'ai', limit: 30 };
  }
  if (pathname.endsWith('/content')) return { name: 'download', limit: 60 };
  if (method !== 'GET' && pathname.endsWith('/restore')) return { name: 'restore', limit: 30 };
  if (method !== 'GET' && pathname.startsWith('/api/v1/documents')) return { name: 'document-write', limit: 60 };
  return null;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
