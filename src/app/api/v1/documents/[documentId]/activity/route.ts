import { NextResponse } from 'next/server';

// GET /api/v1/documents/:documentId/activity — Document activity/audit
// TODO: Implement with authorization
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  void await params;
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', message: 'activity.list not implemented' },
    { status: 501 },
  );
}
