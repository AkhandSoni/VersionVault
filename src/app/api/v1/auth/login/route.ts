import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/services/auth.service';
import { toApiError } from '@/lib/errors';
import { LoginRequestSchema, parseJson } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await parseJson(request, LoginRequestSchema);
    const result = await login(body);

    return NextResponse.json(
      {
        user: result.user,
        message: 'Login successful',
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
