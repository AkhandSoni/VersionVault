import { NextResponse } from 'next/server';

// GET /api/v1/versions/:versionId/diff/:targetVersionId — Deterministic diff
// TODO: Implement with authorization
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ versionId: string; targetVersionId: string }> },
) {
  void await params;
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', message: 'diff not implemented' },
    { status: 501 },
  );
}
