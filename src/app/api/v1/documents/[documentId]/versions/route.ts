import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listVersions, createVersion } from '@/services/version.service';
import { toApiError } from '@/lib/errors';
import { validatePagination } from '@/lib/validation';
import { UPLOAD_LIMITS } from '@/lib/constants';
import { CreateVersionFieldsSchema, parseSchema } from '@/lib/schemas';
import { inferMimeType, validateUpload } from '@/lib/validation';
import { sha256 } from '@/lib/hash';
import { claimIdempotency, completeIdempotency, releaseIdempotency } from '@/services/idempotency.service';

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
  let idempotencyId: string | undefined;
  let idempotencyIsNew = false;
  try {
    const { documentId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Not authenticated' }, { status: 401 });
    }

    const contentLengthHeader = request.headers.get('content-length');
    const contentLength = contentLengthHeader ? Number(contentLengthHeader) : NaN;
    const multipartOverheadAllowance = 1024 * 1024;
    if (Number.isSafeInteger(contentLength) && contentLength > UPLOAD_LIMITS.MAX_UPLOAD_BYTES + multipartOverheadAllowance) {
      return NextResponse.json({ error: 'UPLOAD_TOO_LARGE', message: 'Uploaded file exceeds the maximum allowed size' }, { status: 413 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'file is required in form data' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = inferMimeType(file.name, file.type);
    const fields = parseSchema(CreateVersionFieldsSchema, {
      message: typeof formData.get('message') === 'string' ? formData.get('message') : undefined,
      branchId: typeof formData.get('branchId') === 'string' ? formData.get('branchId') : undefined,
    });

    validateUpload(buffer, mimeType, file.name);
    const idempotencyKey = request.headers.get('Idempotency-Key');
    const claim = await claimIdempotency({
      userId: user.id,
      operation: 'version.create',
      key: idempotencyKey,
      requestHash: sha256(Buffer.from(JSON.stringify({
        documentId,
        branchId: fields.branchId ?? null,
        message: fields.message ?? null,
        fileHash: sha256(buffer),
      }), 'utf-8')),
    });
    if (claim?.state === 'replay') {
      return NextResponse.json(claim.responseBody, { status: claim.responseStatus });
    }
    if (claim?.state === 'in_flight') {
      return NextResponse.json({ error: 'CONFLICT', message: 'A request with this Idempotency-Key is still in progress' }, { status: 409 });
    }
    idempotencyId = claim?.id;
    idempotencyIsNew = Boolean(claim);

    const version = await createVersion(
      user.id,
      documentId,
      buffer,
      mimeType,
      fields.message,
      fields.branchId,
      undefined,
      undefined,
      file.name,
    );

    if (idempotencyId) await completeIdempotency(idempotencyId, version, 201);

    return NextResponse.json(version, { status: 201 });
  } catch (err) {
    if (idempotencyId && idempotencyIsNew) await releaseIdempotency(idempotencyId);
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}
