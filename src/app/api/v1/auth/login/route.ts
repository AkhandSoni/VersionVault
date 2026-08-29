import { NextResponse } from 'next/server';

// POST /api/v1/auth/login
// TODO: Implement user login via Supabase Auth
export async function POST() {
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', message: 'auth.login not implemented' },
    { status: 501 },
  );
}
