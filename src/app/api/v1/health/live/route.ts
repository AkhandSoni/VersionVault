import { NextResponse } from 'next/server';

// GET /api/v1/health/live — Liveness probe
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
