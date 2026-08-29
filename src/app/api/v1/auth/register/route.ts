import { NextRequest, NextResponse } from 'next/server';
import { register } from '@/services/auth.service';
import { toApiError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await register({
      email: body.email,
      password: body.password,
    });

    return NextResponse.json(
      {
        user: result.user,
        tenantId: result.tenantId,
        message: 'Registration successful',
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
