import { NextResponse } from 'next/server';

// GET /api/v1/auth/me
// TODO: Return the currently authenticated user
export async function GET() {
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', message: 'auth.me not implemented' },
    { status: 501 },
  );
}
