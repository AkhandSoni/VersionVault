import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { approveProposal, rejectProposal, getProposalManager } from '@/services/ai.service';
import { toApiError } from '@/lib/errors';
import { assertDocumentCanEdit, assertDocumentCanRead } from '@/services/authorization.service';

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

    const proposalMgr = getProposalManager();
    const proposal = proposalMgr.getProposal(proposalId);
    if (!proposal) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Proposal not found' }, { status: 404 });
    }
    await assertDocumentCanRead(user.id, proposal.documentId);

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
  try {
    const { proposalId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action?.toLowerCase();
    const proposal = getProposalManager().getProposal(proposalId);

    if (!proposal) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Proposal not found' }, { status: 404 });
    }

    await assertDocumentCanEdit(user.id, proposal.documentId);

    if (action === 'approve') {
      const result = await approveProposal(proposalId, user.id);
      return NextResponse.json(result);
    } else if (action === 'reject') {
      const result = await rejectProposal(proposalId, user.id);
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'action must be "approve" or "reject"' },
        { status: 400 },
      );
    }
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}
