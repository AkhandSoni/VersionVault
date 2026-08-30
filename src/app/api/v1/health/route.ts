import { NextResponse } from 'next/server';

// GET /api/v1/health — Global health check probe
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    version: '1.0.0',
    service: 'VersionVault API',
    integrityEngine: 'ACTIVE',
    timestamp: new Date().toISOString(),
  });
}
