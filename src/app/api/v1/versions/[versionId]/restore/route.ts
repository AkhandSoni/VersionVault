import { NextResponse } from 'next/server';

// POST /api/v1/versions/:versionId/restore — Restore a version
// TODO: Implement — creates a new immutable version, does NOT delete history
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ versionId: string }> },
) {
  void await params;
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', message: 'version.restore not implemented' },
    { status: 501 },
  );
}
