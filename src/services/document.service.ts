// ============================================================
// VersionVault — Document Service (Person 1)
// Handles document metadata & scoped tenant queries.
// ============================================================

import { createServiceClient } from '@/lib/supabase/server';
import { NotFoundError, UnauthorizedError, ValidationError, AppError } from '@/lib/errors';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { logEvent } from './activity.service';
import type { Document } from '@/types/domain';
import type { CreateDocumentRequest, UpdateDocumentRequest, PaginatedResponse } from '@/types';

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

  const supabase = await createServiceClient();

  // 1. Verify user membership in tenant (OWNER or CONTRIBUTOR)
  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('tenant_id', data.tenantId)
    .eq('user_id', userId)
    .single();

  if (!membership || membership.role === 'VIEWER') {
    throw new UnauthorizedError('You do not have permission to create documents in this workspace');
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

  if (branch && !branchError) {
    // 4. Update default_branch_id pointer on document
    await supabase
      .from('documents')
      .update({ default_branch_id: branch.id })
      .eq('id', doc.id);
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
  const supabase = await createServiceClient();

  const { data: doc, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (error || !doc) {
    throw new NotFoundError('Document not found');
  }

  // Verify access: user is tenant member or explicit collaborator
  const { data: isMember } = await supabase
    .from('memberships')
    .select('id')
    .eq('tenant_id', doc.tenant_id)
    .eq('user_id', userId)
    .single();

  if (!isMember) {
    const { data: isCollab } = await supabase
      .from('collaborators')
      .select('id')
      .eq('document_id', doc.id)
      .eq('user_id', userId)
      .single();

    if (!isCollab) {
      throw new NotFoundError('Document not found');
    }
  }

  return {
    id: doc.id,
    tenantId: doc.tenant_id,
    title: doc.title,
    currentVersionId: doc.current_version_id,
    defaultBranchId: doc.default_branch_id,
    createdBy: doc.created_by,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
  };
}

export async function listDocuments(
  userId: string,
  tenantId: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PaginatedResponse<Document>> {
  const supabase = await createServiceClient();

  // Verify tenant membership
  const { data: membership } = await supabase
    .from('memberships')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single();

  if (!membership) {
    throw new UnauthorizedError('Not authorized for this workspace');
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await supabase
    .from('documents')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
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
  const doc = await getDocument(userId, documentId);
  if (!doc) {
    throw new NotFoundError('Document not found');
  }

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
