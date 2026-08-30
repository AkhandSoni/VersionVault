import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDocument } from '@/services/document.service';
import { createProposal, getProposalManager } from '@/services/ai.service';
import { toApiError } from '@/lib/errors';
import { assertDocumentCanEdit } from '@/services/authorization.service';

// GET /api/v1/documents/:documentId/proposals — List proposals for document
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

    await getDocument(user.id, documentId);

    const proposalMgr = getProposalManager();
    const proposals = proposalMgr.listPendingProposals(documentId);

    return NextResponse.json({ data: proposals });
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}

// POST /api/v1/documents/:documentId/proposals — Create new AI Proposal
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

    await assertDocumentCanEdit(user.id, documentId);

    const body = await request.json();
    const proposal = await createProposal(
      documentId,
      body.sourceVersionId,
      body.taskDescription ?? body.rationale ?? 'AI Proposal',
      body.agentId ?? 'ai_agent',
      body.proposedContent ?? '',
    );

    return NextResponse.json(proposal, { status: 201 });
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}
