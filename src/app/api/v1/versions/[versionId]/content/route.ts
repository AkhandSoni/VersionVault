import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getVersionContent } from '@/services/version.service';
import { toApiError } from '@/lib/errors';

// GET /api/v1/versions/:versionId/content — Download version content (signed URL)
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

    const result = await getVersionContent(user.id, versionId);
    return NextResponse.json(result);
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}
