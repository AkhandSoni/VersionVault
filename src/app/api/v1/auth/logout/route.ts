import { NextResponse } from 'next/server';

// POST /api/v1/auth/logout
// TODO: Implement user logout via Supabase Auth
export async function POST() {
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', message: 'auth.logout not implemented' },
    { status: 501 },
  );
}
