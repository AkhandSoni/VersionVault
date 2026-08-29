import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getExplanation } from '@/services/ai.service';
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

    const explanation = await getExplanation(baseVersionId, targetVersionId);
    return NextResponse.json(explanation);
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}
