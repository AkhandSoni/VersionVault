import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toApiError, UnauthorizedError, ValidationError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    const accessToken = typeof body.accessToken === 'string' ? body.accessToken : '';
    const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken : '';

    if (!accessToken || !refreshToken) {
      throw new ValidationError('Access token and refresh token are required');
    }

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

async function readJsonObject(request: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ValidationError('Expected a JSON object');
    }
    return body as Record<string, unknown>;
  } catch (err) {
    if (err instanceof ValidationError) throw err;
    throw new ValidationError('Invalid JSON request body');
  }
}

function getFullName(metadata: Record<string, unknown> | null | undefined): string | undefined {
  const fullName = metadata?.full_name ?? metadata?.name;
  return typeof fullName === 'string' && fullName.trim() ? fullName.trim() : undefined;
}
