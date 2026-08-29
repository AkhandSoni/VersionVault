import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/v1/health/ready — Readiness probe
export async function GET() {
  try {
    const supabase = await createServiceClient();
    const { error } = await supabase.from('tenants').select('id').limit(1);

    if (error) {
      return NextResponse.json(
        { status: 'degraded', database: 'error', message: error.message },
        { status: 503 },
      );
    }

    return NextResponse.json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { status: 'not_ready', message: (err as Error).message },
      { status: 503 },
    );
  }
}
