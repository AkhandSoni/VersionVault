import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDocumentActivity } from '@/services/activity.service';
import { toApiError } from '@/lib/errors';
import { validatePagination } from '@/lib/validation';

// GET /api/v1/documents/:documentId/activity — Document activity/audit trail
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

    const url = new URL(request.url);
    const { page, pageSize } = validatePagination(
      url.searchParams.get('page') ?? 1,
      url.searchParams.get('pageSize') ?? 20,
    );

    const events = await getDocumentActivity(user.id, documentId, page, pageSize);
    return NextResponse.json({ data: events, page, pageSize });
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}
