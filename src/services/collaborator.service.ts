// ============================================================
// VersionVault — Collaborator Service (Person 1)
// ============================================================

import { createServiceClient } from '@/lib/supabase/server';
import { NotFoundError, UnauthorizedError, AppError, ValidationError } from '@/lib/errors';
import { logEvent } from './activity.service';
import type { Collaborator } from '@/types/domain';
import type { Permission } from '@/types';

export async function addCollaborator(
  userId: string,
  documentId: string,
  targetUserId: string,
  permission: Permission,
): Promise<Collaborator> {
  if (!targetUserId) {
    throw new ValidationError('targetUserId is required');
  }

  const supabase = await createServiceClient();

  // 1. Verify document exists & requester is OWNER
  const { data: doc } = await supabase
    .from('documents')
    .select('id, tenant_id, created_by')
    .eq('id', documentId)
    .single();

  if (!doc) {
    throw new NotFoundError('Document not found');
  }

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('tenant_id', doc.tenant_id)
    .eq('user_id', userId)
    .single();

  if (!membership || membership.role !== 'OWNER') {
    throw new UnauthorizedError('Only workspace owners can add collaborators');
  }

  // 2. Insert collaborator
  const { data: collab, error } = await supabase
    .from('collaborators')
    .upsert({
      document_id: documentId,
      user_id: targetUserId,
      role: permission,
      added_by: userId,
    })
    .select()
    .single();

  if (error || !collab) {
    throw new AppError(`Failed to add collaborator: ${error?.message}`, 'COLLABORATOR_ADD_FAILED', 400);
  }

  await logEvent({
    tenantId: doc.tenant_id,
    documentId: documentId,
    actorId: userId,
    actorType: 'human',
    eventType: 'PERMISSION_CHANGED',
    metadata: { targetUserId, role: permission },
  });

  return {
    id: collab.id,
    documentId: collab.document_id,
    userId: collab.user_id,
    role: collab.role,
    addedBy: collab.added_by,
    createdAt: collab.created_at,
  };
}

export async function removeCollaborator(
  userId: string,
  documentId: string,
  targetUserId: string,
): Promise<void> {
  const supabase = await createServiceClient();

  const { data: doc } = await supabase
    .from('documents')
    .select('id, tenant_id')
    .eq('id', documentId)
    .single();

  if (!doc) {
    throw new NotFoundError('Document not found');
  }

  const { error } = await supabase
    .from('collaborators')
    .delete()
    .eq('document_id', documentId)
    .eq('user_id', targetUserId);

  if (error) {
    throw new AppError(`Failed to remove collaborator: ${error.message}`, 'COLLABORATOR_REMOVE_FAILED', 400);
  }
}

export async function listCollaborators(
  _userId: string,
  documentId: string,
): Promise<Collaborator[]> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from('collaborators')
    .select('*')
    .eq('document_id', documentId);

  if (error) {
    throw new AppError(`Failed to list collaborators: ${error.message}`, 'COLLABORATOR_LIST_FAILED', 500);
  }

  return (data || []).map((c) => ({
    id: c.id,
    documentId: c.document_id,
    userId: c.user_id,
    role: c.role,
    addedBy: c.added_by,
    createdAt: c.created_at,
  }));
}

export async function updatePermission(
  userId: string,
  documentId: string,
  targetUserId: string,
  permission: Permission,
): Promise<Collaborator> {
  return addCollaborator(userId, documentId, targetUserId, permission);
}
