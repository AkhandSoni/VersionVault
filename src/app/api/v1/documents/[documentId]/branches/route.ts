import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listBranches, createBranch } from '@/services/branch.service';
import { toApiError } from '@/lib/errors';
import { CreateBranchRequestSchema, parseJson } from '@/lib/schemas';
import { claimIdempotency, completeIdempotency, releaseIdempotency } from '@/services/idempotency.service';
import { sha256 } from '@/lib/hash';

// GET /api/v1/documents/:documentId/branches — List branches
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

    const branches = await listBranches(user.id, documentId);
    return NextResponse.json({ data: branches });
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}

// POST /api/v1/documents/:documentId/branches — Create branch
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

    const body = await parseJson(request, CreateBranchRequestSchema);
    const claim = await claimIdempotency({
      userId: user.id,
      operation: 'branch.create',
      key: request.headers.get('Idempotency-Key'),
      requestHash: sha256(Buffer.from(JSON.stringify({ documentId, body }), 'utf-8')),
    });
    if (claim?.state === 'replay') return NextResponse.json(claim.responseBody, { status: claim.responseStatus });
    if (claim?.state === 'in_flight') {
      return NextResponse.json({ error: 'CONFLICT', message: 'A request with this Idempotency-Key is still in progress' }, { status: 409 });
    }
    idempotencyId = claim?.id;
    idempotencyIsNew = Boolean(claim);
    const branch = await createBranch(user.id, documentId, body);
    if (idempotencyId) await completeIdempotency(idempotencyId, branch, 201);

    return NextResponse.json(branch, { status: 201 });
  } catch (err) {
    if (idempotencyId && idempotencyIsNew) await releaseIdempotency(idempotencyId);
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}
