import { NextResponse } from 'next/server';

// GET   /api/v1/documents/:documentId — Get document detail
// PATCH /api/v1/documents/:documentId — Update document metadata
// TODO: Implement with authorization check
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  void await params;
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', message: 'documents.get not implemented' },
    { status: 501 },
  );
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  void await params;
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', message: 'documents.update not implemented' },
    { status: 501 },
  );
}
