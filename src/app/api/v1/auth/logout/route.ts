import { NextResponse } from 'next/server';
import { logout } from '@/services/auth.service';
import { toApiError } from '@/lib/errors';

export async function POST() {
  try {
    await logout();
    return NextResponse.json(
      { message: 'Logged out successfully' },
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
