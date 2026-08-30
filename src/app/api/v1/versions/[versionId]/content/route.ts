import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { downloadVersionContent } from '@/services/version.service';
import { toApiError } from '@/lib/errors';

// GET /api/v1/versions/:versionId/content — Download exact immutable version bytes
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

    const result = await downloadVersionContent(user.id, versionId);
    return new NextResponse(new Uint8Array(result.data), {
      status: 200,
      headers: {
        'Content-Type': result.mimeType,
        'Content-Length': String(result.data.byteLength),
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}
