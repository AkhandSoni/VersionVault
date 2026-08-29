import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { removeCollaborator } from '@/services/collaborator.service';
import { toApiError } from '@/lib/errors';

// DELETE /api/v1/documents/:documentId/collaborators/:userId — Remove collaborator
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ documentId: string; userId: string }> },
) {
  try {
    const { documentId, userId: targetUserId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Not authenticated' }, { status: 401 });
    }

    await removeCollaborator(user.id, documentId, targetUserId);
    return NextResponse.json({ message: 'Collaborator removed' });
  } catch (err) {
    const apiError = toApiError(err);
    return NextResponse.json({ error: apiError.error, message: apiError.message }, { status: apiError.statusCode });
  }
}
