import { NextResponse } from 'next/server';

// GET /api/v1/health/ready — Readiness probe
// TODO: Check Supabase connection, Redis connection, etc.
export async function GET() {
  return NextResponse.json(
    { status: 'not_ready', message: 'Readiness checks not implemented' },
    { status: 503 },
  );
}
