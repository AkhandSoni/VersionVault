import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { APP_URL } from '@/lib/config';
import { toApiError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const requestedNext = request.nextUrl.searchParams.get('redirectTo') || '/dashboard';
    const next = new URL(requestedNext, APP_URL).toString();
    const callbackUrl = new URL('/api/v1/auth/callback', APP_URL);
    callbackUrl.searchParams.set('next', next);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error || !data.url) {
      throw error ?? new Error('Google sign-in URL was not returned');
    }

    return NextResponse.redirect(data.url);
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json(
      { error: apiError.error, message: apiError.message },
      { status: apiError.statusCode },
    );
  }
}
