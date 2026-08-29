import { NextResponse } from 'next/server';

// GET /api/v1/versions/:versionId — Get version detail
// TODO: Implement with authorization
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ versionId: string }> },
) {
  void await params;
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', message: 'version.get not implemented' },
    { status: 501 },
  );
}
