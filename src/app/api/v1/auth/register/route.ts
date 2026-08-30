import { NextRequest, NextResponse } from 'next/server';
import { register } from '@/services/auth.service';
import { toApiError, ValidationError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    const result = await register({
      email: typeof body.email === 'string' ? body.email : '',
      password: typeof body.password === 'string' ? body.password : '',
      fullName: typeof body.fullName === 'string' ? body.fullName : undefined,
    });

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
