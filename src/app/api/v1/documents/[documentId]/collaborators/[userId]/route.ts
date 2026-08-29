import { NextResponse } from 'next/server';

// DELETE /api/v1/documents/:documentId/collaborators/:userId — Remove collaborator
// TODO: Implement with authorization (owner only)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ documentId: string; userId: string }> },
) {
  void await params;
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', message: 'collaborators.remove not implemented' },
    { status: 501 },
  );
}
