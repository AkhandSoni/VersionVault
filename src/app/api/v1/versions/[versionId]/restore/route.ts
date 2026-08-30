import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { restoreVersion } from '@/services/version.service';
import { toApiError } from '@/lib/errors';
import { RestoreVersionRequestSchema, parseJson } from '@/lib/schemas';
import { claimIdempotency, completeIdempotency, releaseIdempotency } from '@/services/idempotency.service';
import { sha256 } from '@/lib/hash';

function requestHash(versionId: string, body: unknown): string {
  return sha256(Buffer.from(JSON.stringify({ versionId, body }), 'utf-8'));
}

// POST /api/v1/versions/:versionId/restore — Restore a version (creates new immutable version)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> },
) {
  let idempotencyId: string | undefined;
  let idempotencyIsNew = false;
  try {
    const { versionId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Not authenticated' }, { status: 401 });
    }

    const body = await parseJson(request, RestoreVersionRequestSchema);
    const claim = await claimIdempotency({
      userId: user.id,
      operation: 'version.restore',
      key: request.headers.get('Idempotency-Key'),
      requestHash: requestHash(versionId, body),
    });
    if (claim?.state === 'replay') return NextResponse.json(claim.responseBody, { status: claim.responseStatus });
    if (claim?.state === 'in_flight') {
      return NextResponse.json({ error: 'CONFLICT', message: 'A request with this Idempotency-Key is still in progress' }, { status: 409 });
    }
    idempotencyId = claim?.id;
    idempotencyIsNew = Boolean(claim);
    const version = await restoreVersion(user.id, versionId, {
      message: body.message,
      branchId: body.branchId,
    }, true);
    if (idempotencyId) await completeIdempotency(idempotencyId, version, 201);

    return NextResponse.json(version, { status: 201 });
  } catch (err) {
    if (idempotencyId && idempotencyIsNew) await releaseIdempotency(idempotencyId);
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}
