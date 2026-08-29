import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { restoreVersion } from '@/services/version.service';
import { toApiError } from '@/lib/errors';

// POST /api/v1/versions/:versionId/restore — Restore a version (creates new immutable version)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> },
) {
  try {
    const { versionId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const version = await restoreVersion(user.id, versionId, {
      message: body.message,
      branchId: body.branchId,
    });

    return NextResponse.json(version, { status: 201 });
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}
