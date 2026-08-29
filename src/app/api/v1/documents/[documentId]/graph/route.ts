import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDocument } from '@/services/document.service';
import { listVersions } from '@/services/version.service';
import { toApiError } from '@/lib/errors';
import type { VersionGraphNode } from '@/types/api';

// GET /api/v1/documents/:documentId/graph — Version lineage DAG graph
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

    // 1. Authorize document access
    await getDocument(user.id, documentId);

    // 2. Fetch all versions for document
    const { data: versions } = await listVersions(user.id, documentId, 1, 500);

    // 3. Construct parent -> children mapping
    const childrenMap = new Map<string, string[]>();
    for (const v of versions) {
      if (v.parentVersionId) {
        const existing = childrenMap.get(v.parentVersionId) || [];
        existing.push(v.id);
        childrenMap.set(v.parentVersionId, existing);
      }
    }

    const nodes: VersionGraphNode[] = versions.map((v) => ({
      version: v,
      children: childrenMap.get(v.id) || [],
    }));

    return NextResponse.json({ nodes });
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}
