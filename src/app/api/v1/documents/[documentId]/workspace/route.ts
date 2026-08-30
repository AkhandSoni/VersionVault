import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDocument } from '@/services/document.service';
import { listBranchesForAuthorizedDocument } from '@/services/branch.service';
import { listVersionsForAuthorizedDocument } from '@/services/version.service';
import { computeDiff, storeStructuredChanges } from '@/services/diff.service';
import { createServiceClient } from '@/lib/supabase/server';
import { toApiError } from '@/lib/errors';

// GET /api/v1/documents/:documentId/workspace
// Returns the authorized document graph in one request. This prevents the
// client from issuing one diff request per historical version.
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

    const document = await getDocument(user.id, documentId);
    const [versionResponse, branches] = await Promise.all([
      listVersionsForAuthorizedDocument(documentId, 1, 100),
      listBranchesForAuthorizedDocument(documentId),
    ]);

    const versionsWithParents = versionResponse.data.filter((version) => version.parentVersionId);
    const versionIds = versionResponse.data.map((version) => version.id);
    const changesByTarget = new Map<string, Array<Record<string, unknown>>>();

    if (versionIds.length > 0) {
      const serviceClient = await createServiceClient();
      const { data: storedChanges } = await serviceClient
        .from('structured_changes')
        .select('id, base_version_id, target_version_id, type, section, old_value, new_value, category, severity, confidence, location')
        .in('target_version_id', versionIds);

      for (const change of storedChanges ?? []) {
        const current = changesByTarget.get(change.target_version_id) ?? [];
        current.push({
          id: change.id,
          baseVersionId: change.base_version_id,
          targetVersionId: change.target_version_id,
          type: change.type,
          section: change.section ?? undefined,
          oldValue: change.old_value ?? undefined,
          newValue: change.new_value ?? undefined,
          category: change.category ?? undefined,
          severity: change.severity ?? undefined,
          confidence: change.confidence ?? undefined,
          location: change.location ?? undefined,
        });
        changesByTarget.set(change.target_version_id, current);
      }
    }

    // Backfill only versions whose derived evidence has not been persisted.
    // The immutable artifact remains authoritative if this best-effort step
    // cannot run.
    await Promise.all(versionsWithParents
      .filter((version) => !changesByTarget.has(version.id))
      .map(async (version) => {
        try {
          const changes = await computeDiff(version.parentVersionId as string, version.id);
          await storeStructuredChanges(changes);
          changesByTarget.set(version.id, changes as unknown as Array<Record<string, unknown>>);
        } catch {
          changesByTarget.set(version.id, []);
        }
      }));

    return NextResponse.json({
      document,
      versions: versionResponse.data,
      branches,
      changes: [...changesByTarget.values()].flat(),
      totalVersions: versionResponse.total,
      hasMoreVersions: versionResponse.total > versionResponse.data.length,
    });
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}
