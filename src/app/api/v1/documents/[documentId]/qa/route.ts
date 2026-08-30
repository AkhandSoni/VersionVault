import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDocument } from '@/services/document.service';
import { answerHistoryQuestion } from '@/services/ai.service';
import { toApiError } from '@/lib/errors';
import { HistoryQuestionSchema, parseJson } from '@/lib/schemas';

// POST /api/v1/documents/:documentId/qa — Grounded History Q&A
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

    const doc = await getDocument(user.id, documentId);
    if (!doc) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Document not found' }, { status: 404 });
    }

    const body = await parseJson(request, HistoryQuestionSchema);

    const answer = await answerHistoryQuestion(
      documentId,
      body.question,
      user.id,
    );

    return NextResponse.json(answer);
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}
