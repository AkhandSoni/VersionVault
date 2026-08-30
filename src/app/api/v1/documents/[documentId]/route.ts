import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteDocument, getDocument, purgeDocument, updateDocument } from '@/services/document.service';
import { toApiError } from '@/lib/errors';
import { UpdateDocumentRequestSchema, parseJson } from '@/lib/schemas';

// GET /api/v1/documents/:documentId — Get document detail
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  try {
    const { documentId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Not authenticated' }, { status: 401 });
    }

    const doc = await getDocument(user.id, documentId);
    return NextResponse.json(doc);
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}

// PATCH /api/v1/documents/:documentId — Update document metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  try {
    const { documentId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Not authenticated' }, { status: 401 });
    }

    const body = await parseJson(request, UpdateDocumentRequestSchema);
    const doc = await updateDocument(user.id, documentId, body);
    return NextResponse.json(doc);
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}

// DELETE /api/v1/documents/:documentId — Soft-delete document and remove blobs
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  try {
    const { documentId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Not authenticated' }, { status: 401 });
    }

    const permanent = new URL(request.url).searchParams.get('permanent') === 'true';
    if (permanent) {
      await purgeDocument(user.id, documentId);
      return NextResponse.json({ message: 'Document and all versions permanently deleted' });
    }

    await deleteDocument(user.id, documentId);
    return NextResponse.json({ message: 'Document archived' });
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}
