import { NextResponse } from 'next/server';

// GET /api/v1/versions/:versionId/content — Download version content
// TODO: Implement with authorization + signed URL
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ versionId: string }> },
) {
  void await params;
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', message: 'version.content not implemented' },
    { status: 501 },
  );
}
