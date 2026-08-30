import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensurePersonalWorkspace } from '@/services/auth.service';
import { getSafeAppRedirect } from '@/lib/config';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = getSafeAppRedirect(requestUrl.searchParams.get('next'));

  if (!code) {
    next.pathname = '/login';
    next.searchParams.set('error', 'oauth_failed');
    return NextResponse.redirect(next);
  }

  try {
    const supabase = await createClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError || !data.user) {
      throw new Error('OAuth session exchange failed');
    }

    await ensurePersonalWorkspace(data.user.id, data.user.email || 'Google user');
  } catch {
    next.pathname = '/login';
    next.searchParams.set('error', 'oauth_failed');
    return NextResponse.redirect(next);
  }

  return NextResponse.redirect(next);
}
