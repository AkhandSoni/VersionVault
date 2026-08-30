import { NextRequest, NextResponse } from 'next/server';
import { register } from '@/services/auth.service';
import { toApiError } from '@/lib/errors';
import { parseJson, RegisterRequestSchema } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await parseJson(request, RegisterRequestSchema);
    const result = await register(body);

    return NextResponse.json(
      {
        user: result.user,
        tenantId: result.tenantId,
        needsEmailConfirmation: !result.session,
        message: result.session ? 'Registration successful' : 'Check your email to confirm your account',
      },
      { status: 201 },
    );
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json(
      { error: apiError.error, message: apiError.message },
      { status: apiError.statusCode },
    );
  }
}
