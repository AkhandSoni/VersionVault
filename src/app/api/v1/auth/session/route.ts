import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toApiError, UnauthorizedError } from '@/lib/errors';
import { SessionRequestSchema, parseJson } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await parseJson(request, SessionRequestSchema);
    const { accessToken, refreshToken } = body;

    const supabase = await createClient();
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error || !data.user) {
      throw new UnauthorizedError(error?.message || 'Could not establish session');
    }

    return NextResponse.json(
      {
        user: {
          id: data.user.id,
          email: data.user.email || '',
          fullName: getFullName(data.user.user_metadata),
          createdAt: data.user.created_at || new Date().toISOString(),
        },
        message: 'Session established',
      },
      { status: 200 },
    );
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json(
      { error: apiError.error, message: apiError.message },
      { status: apiError.statusCode },
    );
  }
}

function getFullName(metadata: Record<string, unknown> | null | undefined): string | undefined {
  const fullName = metadata?.full_name ?? metadata?.name;
  return typeof fullName === 'string' && fullName.trim() ? fullName.trim() : undefined;
}
