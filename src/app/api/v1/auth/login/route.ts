import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/services/auth.service';
import { toApiError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await login({
      email: body.email,
      password: body.password,
    });

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
