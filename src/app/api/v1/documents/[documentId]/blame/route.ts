import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDocument } from '@/services/document.service';
import { listVersions } from '@/services/version.service';
import { getVersionTextContents } from '@/services/extraction.service';
import { computeDocumentBlame, computeSectionBlame } from '@/engine/provenance';
import { toApiError } from '@/lib/errors';

// GET /api/v1/documents/:documentId/blame — Line/Section Provenance & Blame
export async function GET(
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

    // 1. Authorize document access
    await getDocument(user.id, documentId);

    // 2. Fetch versions for document
    const { data: versions } = await listVersions(user.id, documentId, 1, 100);

    // 3. Build versionContents map from extracted text only.
    const versionContents = await getVersionTextContents(versions.map((version) => version.id));

    const url = new URL(request.url);
    const section = url.searchParams.get('section');

    if (section) {
      const sectionBlame = computeSectionBlame(section, versions, versionContents);
      return NextResponse.json(sectionBlame);
    }

    const blame = computeDocumentBlame(versions, versionContents);
    return NextResponse.json({ data: blame });
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}
