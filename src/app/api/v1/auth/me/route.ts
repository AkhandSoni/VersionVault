import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth.service';
import { UnauthorizedError, toApiError } from '@/lib/errors';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('Not authenticated');
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json(
      { error: apiError.error, message: apiError.message },
      { status: apiError.statusCode },
    );
  }
}
