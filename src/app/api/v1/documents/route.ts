import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDocument, listDocuments } from '@/services/document.service';
import { toApiError } from '@/lib/errors';
import { validatePagination } from '@/lib/validation';
import { validateUuid } from '@/lib/validation';
import { CreateDocumentRequestSchema, parseJson } from '@/lib/schemas';

// GET  /api/v1/documents — List authorized documents
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Not authenticated' }, { status: 401 });
    }

    const url = new URL(request.url);
    const tenantId = url.searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'tenantId query parameter is required' }, { status: 400 });
    }
    validateUuid(tenantId, 'tenantId');

    const { page, pageSize } = validatePagination(
      url.searchParams.get('page') ?? 1,
      url.searchParams.get('pageSize') ?? 20,
    );

    const result = await listDocuments(user.id, tenantId, page, pageSize);
    return NextResponse.json(result);
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}

// POST /api/v1/documents — Create a new document
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Not authenticated' }, { status: 401 });
    }

    const body = await parseJson(request, CreateDocumentRequestSchema);
    const doc = await createDocument(user.id, body);

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}
