import { NextResponse } from 'next/server';

// GET  /api/v1/documents/:documentId/collaborators — List collaborators
// POST /api/v1/documents/:documentId/collaborators — Add collaborator
// TODO: Implement with authorization (owner only for add)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  void await params;
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', message: 'collaborators.list not implemented' },
    { status: 501 },
  );
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  void await params;
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', message: 'collaborators.add not implemented' },
    { status: 501 },
  );
}
