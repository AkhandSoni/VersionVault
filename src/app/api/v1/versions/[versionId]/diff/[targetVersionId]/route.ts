import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDocument } from '@/services/document.service';
import { computeDiff } from '@/services/diff.service';
import { toApiError } from '@/lib/errors';

// GET /api/v1/versions/:versionId/diff/:targetVersionId — Deterministic diff
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

    // Verify authorization via the base version's document
    const serviceSupabase = await (await import('@/lib/supabase/server')).createServiceClient();
    const { data: baseVer } = await serviceSupabase
      .from('versions')
      .select('document_id')
      .eq('id', baseVersionId)
      .single();

    if (baseVer) {
      await getDocument(user.id, baseVer.document_id);
    }

    const changes = await computeDiff(baseVersionId, targetVersionId);
    const materialChanges = changes.filter((c) => c.severity === 'HIGH' || c.severity === 'MEDIUM');

    return NextResponse.json({
      baseVersionId,
      targetVersionId,
      changes,
      materialChangeCount: materialChanges.length,
    });
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}
