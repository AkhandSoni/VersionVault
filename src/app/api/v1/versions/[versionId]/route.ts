import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getVersion } from '@/services/version.service';
import { toApiError } from '@/lib/errors';

// GET /api/v1/versions/:versionId — Get version detail
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ versionId: string }> },
) {
  try {
    const { versionId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Not authenticated' }, { status: 401 });
    }

    const version = await getVersion(user.id, versionId);
    return NextResponse.json(version);
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}
