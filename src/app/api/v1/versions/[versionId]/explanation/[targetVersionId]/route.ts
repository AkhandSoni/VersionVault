import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getExplanation } from '@/services/ai.service';
import { getVersion } from '@/services/version.service';
import { toApiError } from '@/lib/errors';

// GET /api/v1/versions/:versionId/explanation/:targetVersionId — Grounded AI Diff Explanation
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ versionId: string; targetVersionId: string }> },
) {
  try {
    const { versionId: baseVersionId, targetVersionId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Not authenticated' }, { status: 401 });
    }

    const baseVersion = await getVersion(user.id, baseVersionId);
    const targetVersion = await getVersion(user.id, targetVersionId);

    if (baseVersion?.documentId !== targetVersion?.documentId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Versions must belong to the same document' },
        { status: 400 },
      );
    }

    const explanation = await getExplanation(baseVersionId, targetVersionId, undefined, undefined, user.id);
    return NextResponse.json(explanation);
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}
