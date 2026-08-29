import { NextResponse } from 'next/server';

// GET  /api/v1/documents — List authorized documents
// POST /api/v1/documents — Create a new document
// TODO: Implement with authorization scoping
export async function GET() {
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', message: 'documents.list not implemented' },
    { status: 501 },
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', message: 'documents.create not implemented' },
    { status: 501 },
  );
}
