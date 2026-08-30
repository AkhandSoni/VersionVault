// ============================================================
// VersionVault — Document Service (Person 1)
// Handles document metadata & scoped tenant queries.
// ============================================================

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { ValidationError, AppError, NotFoundError, ForbiddenError } from '@/lib/errors';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { logEvent } from './activity.service';
import { assertDocumentCanEdit, assertDocumentCanRead, assertDocumentOwner } from './authorization.service';
import { deleteObjects } from './storage.service';
import type { Document } from '@/types/domain';
import type { CreateDocumentRequest, UpdateDocumentRequest, PaginatedResponse } from '@/types/api';

export async function createDocument(
  userId: string,
  data: CreateDocumentRequest,
): Promise<Document> {
  if (!data.title?.trim()) {
    throw new ValidationError('Document title is required');
  }

  if (!data.tenantId) {
    throw new ValidationError('tenantId is required');
  }

  const supabase = await createClient();

  const { data: membership, error: membershipError } = await supabase
    .from('memberships')
    .select('role')
    .eq('tenant_id', data.tenantId)
    .eq('user_id', userId)
    .maybeSingle();

  if (membershipError) {
    throw new AppError(`Failed to check workspace membership: ${membershipError.message}`, 'MEMBERSHIP_CHECK_FAILED', 500);
  }

  if (!membership) {
    throw new NotFoundError('Workspace not found');
  }

  if (membership.role !== 'OWNER' && membership.role !== 'CONTRIBUTOR') {
    throw new ForbiddenError('You do not have permission to edit this workspace');
  }

  // 2. Insert document container
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .insert({
      title: data.title.trim(),
      tenant_id: data.tenantId,
      created_by: userId,
    })
    .select()
    .single();

  if (docError || !doc) {
    throw new AppError(`Failed to create document: ${docError?.message}`, 'DOCUMENT_CREATE_FAILED', 400);
  }

  // 3. Create default 'main' branch for this document
  const { data: branch, error: branchError } = await supabase
    .from('branches')
    .insert({
      document_id: doc.id,
      tenant_id: doc.tenant_id,
      name: 'main',
      status: 'ACTIVE',
      created_by: userId,
    })
    .select('id')
    .single();

  if (branchError || !branch) {
    const cleanupClient = await createServiceClient();
    await cleanupClient.from('documents').delete().eq('id', doc.id);
    throw new AppError(`Failed to create default branch: ${branchError?.message ?? 'No branch returned'}`, 'BRANCH_CREATE_FAILED', 500);
  }

  // 4. Update default_branch_id pointer on document
  const { error: defaultBranchError } = await supabase
      .from('documents')
      .update({ default_branch_id: branch.id })
      .eq('id', doc.id);
  if (defaultBranchError) {
    const cleanupClient = await createServiceClient();
    await cleanupClient.from('branches').delete().eq('id', branch.id);
    await cleanupClient.from('documents').delete().eq('id', doc.id);
    throw new AppError(`Failed to set default branch: ${defaultBranchError.message}`, 'DOCUMENT_CREATE_FAILED', 500);
  }

  // 5. Log audit event
  await logEvent({
    tenantId: doc.tenant_id,
    documentId: doc.id,
    actorId: userId,
    actorType: 'human',
    eventType: 'DOCUMENT_CREATED',
    metadata: { title: doc.title },
  });

  return {
    id: doc.id,
    tenantId: doc.tenant_id,
    title: doc.title,
    currentVersionId: doc.current_version_id,
    defaultBranchId: branch?.id ?? doc.default_branch_id,
    createdBy: doc.created_by,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
  };
}

export async function getDocument(
  userId: string,
  documentId: string,
): Promise<Document | null> {
  const { document } = await assertDocumentCanRead(userId, documentId);
  return document;
}

export async function listDocuments(
  userId: string,
  tenantId: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PaginatedResponse<Document>> {
  const supabase = await createClient();

  const { data: membership, error: membershipError } = await supabase
    .from('memberships')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .maybeSingle();

  if (membershipError) {
    throw new AppError(`Failed to check workspace membership: ${membershipError.message}`, 'MEMBERSHIP_CHECK_FAILED', 500);
  }

  if (!membership) {
    throw new NotFoundError('Workspace not found');
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await supabase
    .from('documents')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new AppError(`Failed to list documents: ${error.message}`, 'DOCUMENTS_LIST_FAILED', 500);
  }

  const items: Document[] = (data || []).map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    currentVersionId: row.current_version_id,
    defaultBranchId: row.default_branch_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    accessRole: membership.role as Document['accessRole'],
  }));

  return {
    data: items,
    total: count ?? items.length,
    page,
    pageSize,
  };
}

export async function updateDocument(
  userId: string,
  documentId: string,
  data: UpdateDocumentRequest,
): Promise<Document> {
  const { document: doc } = await assertDocumentCanEdit(userId, documentId);

  const supabase = await createServiceClient();

  const { data: updatedDoc, error } = await supabase
    .from('documents')
    .update({
      title: data.title?.trim() ?? doc.title,
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId)
    .select()
    .single();

  if (error || !updatedDoc) {
    throw new AppError(`Failed to update document: ${error?.message}`, 'DOCUMENT_UPDATE_FAILED', 400);
  }

  return {
    id: updatedDoc.id,
    tenantId: updatedDoc.tenant_id,
    title: updatedDoc.title,
    currentVersionId: updatedDoc.current_version_id,
    defaultBranchId: updatedDoc.default_branch_id,
    createdBy: updatedDoc.created_by,
    createdAt: updatedDoc.created_at,
    updatedAt: updatedDoc.updated_at,
  };
}

export async function deleteDocument(userId: string, documentId: string): Promise<void> {
  const { document: doc } = await assertDocumentOwner(userId, documentId);
  const supabase = await createServiceClient();

  const { data: storageRows, error: storageListError } = await supabase
    .from('storage_objects')
    .select('storage_path')
    .eq('document_id', documentId);

  if (storageListError) {
    throw new AppError(`Failed to list document storage: ${storageListError.message}`, 'DOCUMENT_STORAGE_LIST_FAILED', 500);
  }

  await deleteObjects((storageRows || []).map((row) => row.storage_path).filter(Boolean));

  await logEvent({
    tenantId: doc.tenantId,
    documentId,
    actorId: userId,
    actorType: 'human',
    eventType: 'DOCUMENT_DELETED',
    metadata: { title: doc.title },
  });

  const deletedAt = new Date().toISOString();
  const { error: archiveBranchesError } = await supabase
    .from('branches')
    .update({ status: 'ARCHIVED' })
    .eq('document_id', documentId);
  if (archiveBranchesError) {
    throw new AppError(`Failed to archive document branches: ${archiveBranchesError.message}`, 'DOCUMENT_ARCHIVE_FAILED', 500);
  }

  const { error: deleteError } = await supabase
    .from('documents')
    .update({ deleted_at: deletedAt })
    .eq('id', documentId)
    .is('deleted_at', null);

  if (deleteError) {
    throw new AppError(`Failed to soft-delete document: ${deleteError.message}`, 'DOCUMENT_DELETE_FAILED', 500);
  }
}

/**
 * Permanently remove a document and its complete version graph.
 * Storage is deleted first; the database RPC then removes all dependent
 * records in one transaction and leaves only a tenant-level audit event.
 */
export async function purgeDocument(userId: string, documentId: string): Promise<void> {
  await assertDocumentOwner(userId, documentId);
  const supabase = await createServiceClient();

  const { data: storageRows, error: storageListError } = await supabase
    .from('storage_objects')
    .select('storage_path')
    .eq('document_id', documentId);

  if (storageListError) {
    throw new AppError(`Failed to list document storage: ${storageListError.message}`, 'DOCUMENT_STORAGE_LIST_FAILED', 500);
  }

  await deleteObjects((storageRows || []).map((row) => row.storage_path).filter(Boolean));

  const { error: purgeError } = await supabase.rpc('purge_document', {
    p_document_id: documentId,
    p_actor_id: userId,
  });

  if (purgeError) {
    throw new AppError(`Failed to permanently delete document: ${purgeError.message}`, 'DOCUMENT_PURGE_FAILED', 500);
  }

}
