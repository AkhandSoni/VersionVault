import { NextResponse } from 'next/server';

// GET  /api/v1/documents/:documentId/versions — List versions
// POST /api/v1/documents/:documentId/versions — Create new version (upload)
// TODO: Implement with authorization + upload pipeline
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  void await params;
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', message: 'versions.list not implemented' },
    { status: 501 },
  );
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  void await params;
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', message: 'versions.create not implemented' },
    { status: 501 },
  );
}
