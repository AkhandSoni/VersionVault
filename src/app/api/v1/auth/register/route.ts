import { NextResponse } from 'next/server';

// POST /api/v1/auth/register
// TODO: Implement user registration via Supabase Auth
export async function POST() {
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', message: 'auth.register not implemented' },
    { status: 501 },
  );
}
