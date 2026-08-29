import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listBranches, createBranch } from '@/services/branch.service';
import { toApiError } from '@/lib/errors';

// GET /api/v1/documents/:documentId/branches — List branches
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

    const branches = await listBranches(user.id, documentId);
    return NextResponse.json({ data: branches });
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}

// POST /api/v1/documents/:documentId/branches — Create branch
export async function POST(
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

    const body = await request.json();
    const branch = await createBranch(user.id, documentId, {
      name: body.name,
      baseVersionId: body.baseVersionId,
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}
