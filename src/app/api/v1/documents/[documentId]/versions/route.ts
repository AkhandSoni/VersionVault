import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listVersions, createVersion } from '@/services/version.service';
import { toApiError } from '@/lib/errors';
import { validatePagination } from '@/lib/validation';

// GET /api/v1/documents/:documentId/versions — List versions
export async function GET(
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

    const url = new URL(request.url);
    const { page, pageSize } = validatePagination(
      url.searchParams.get('page') ?? 1,
      url.searchParams.get('pageSize') ?? 20,
    );

    const result = await listVersions(user.id, documentId, page, pageSize);
    return NextResponse.json(result);
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}

// POST /api/v1/documents/:documentId/versions — Create new version (file upload)
export async function POST(
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'file is required in form data' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'application/octet-stream';
    const message = formData.get('message') as string | null;
    const branchId = formData.get('branchId') as string | null;

    const version = await createVersion(
      user.id,
      documentId,
      buffer,
      mimeType,
      message ?? undefined,
      branchId ?? undefined,
    );

    return NextResponse.json(version, { status: 201 });
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}
