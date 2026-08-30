import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { approveProposal, rejectProposal, getDocumentProposal } from '@/services/ai.service';
import { toApiError } from '@/lib/errors';
import { assertDocumentCanEdit } from '@/services/authorization.service';
import { ProposalReviewRequestSchema, parseJson } from '@/lib/schemas';
import { claimIdempotency, completeIdempotency, releaseIdempotency } from '@/services/idempotency.service';
import { sha256 } from '@/lib/hash';

// GET /api/v1/proposals/:proposalId — Get proposal detail
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ proposalId: string }> },
) {
  try {
    const { proposalId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Not authenticated' }, { status: 401 });
    }

    const proposal = await getDocumentProposal(user.id, proposalId);
    if (!proposal) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Proposal not found' }, { status: 404 });
    }
    return NextResponse.json(proposal);
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}

// POST /api/v1/proposals/:proposalId/review (action: approve | reject)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ proposalId: string }> },
) {
  let idempotencyId: string | undefined;
  let idempotencyIsNew = false;
  try {
    const { proposalId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Not authenticated' }, { status: 401 });
    }

    const body = await parseJson(request, ProposalReviewRequestSchema);
    const claim = await claimIdempotency({
      userId: user.id,
      operation: 'proposal.review',
      key: request.headers.get('Idempotency-Key'),
      requestHash: sha256(Buffer.from(JSON.stringify({ proposalId, body }), 'utf-8')),
    });
    if (claim?.state === 'replay') return NextResponse.json(claim.responseBody, { status: claim.responseStatus });
    if (claim?.state === 'in_flight') {
      return NextResponse.json({ error: 'CONFLICT', message: 'A request with this Idempotency-Key is still in progress' }, { status: 409 });
    }
    idempotencyId = claim?.id;
    idempotencyIsNew = Boolean(claim);
    const action = body.action;
    const proposal = await getDocumentProposal(user.id, proposalId);

    if (!proposal) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Proposal not found' }, { status: 404 });
    }

    await assertDocumentCanEdit(user.id, proposal.documentId);

    if (action === 'approve') {
      const result = await approveProposal(proposalId, user.id);
      if (idempotencyId) await completeIdempotency(idempotencyId, result, 200);
      return NextResponse.json(result);
    } else if (action === 'reject') {
      const result = await rejectProposal(proposalId, user.id);
      if (idempotencyId) await completeIdempotency(idempotencyId, result, 200);
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'action must be "approve" or "reject"' },
        { status: 400 },
      );
    }
  } catch (err) {
    if (idempotencyId && idempotencyIsNew) await releaseIdempotency(idempotencyId);
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}
