import { NextResponse } from 'next/server';

// GET /api/v1/documents/:documentId/blame — Provenance/blame
// TODO: Implement with authorization
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  void await params;
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', message: 'blame not implemented' },
    { status: 501 },
  );
}
