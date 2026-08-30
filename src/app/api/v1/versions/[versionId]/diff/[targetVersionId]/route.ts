import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getVersion } from '@/services/version.service';
import { computeDiff, storeStructuredChanges } from '@/services/diff.service';
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

    const baseVersion = await getVersion(user.id, baseVersionId);
    const targetVersion = await getVersion(user.id, targetVersionId);

    if (baseVersion?.documentId !== targetVersion?.documentId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Versions must belong to the same document' },
        { status: 400 },
      );
    }

    const changes = await computeDiff(baseVersionId, targetVersionId);
    await storeStructuredChanges(changes);
    const materialChanges = changes.filter((c) => c.severity === 'HIGH' || c.severity === 'MEDIUM');

    return NextResponse.json({
      baseVersionId,
      targetVersionId,
      changes,
      materialChangeCount: materialChanges.length,
      extractionBacked: changes.length > 0,
    });
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}
