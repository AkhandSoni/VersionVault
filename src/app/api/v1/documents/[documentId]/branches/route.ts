import { NextResponse } from 'next/server';

// GET  /api/v1/documents/:documentId/branches — List branches
// POST /api/v1/documents/:documentId/branches — Create branch
// TODO: Implement with authorization
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  void await params;
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', message: 'branches.list not implemented' },
    { status: 501 },
  );
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  void await params;
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', message: 'branches.create not implemented' },
    { status: 501 },
  );
}
