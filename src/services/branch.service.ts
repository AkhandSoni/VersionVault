// ============================================================
// VersionVault — Branch Service (Person 1)
// ============================================================

import { createServiceClient } from '@/lib/supabase/server';
import { NotFoundError, AppError, ValidationError } from '@/lib/errors';
import { logEvent } from './activity.service';
import type { Branch } from '@/types/domain';
import type { CreateBranchRequest } from '@/types';

export async function createBranch(
  userId: string,
  documentId: string,
  data: CreateBranchRequest,
): Promise<Branch> {
  if (!data.name || !data.baseVersionId) {
    throw new ValidationError('Branch name and baseVersionId are required');
  }

  const supabase = await createServiceClient();

  // Verify document exists and retrieve tenant
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('id, tenant_id')
    .eq('id', documentId)
    .single();

  if (docError || !doc) {
    throw new NotFoundError('Document not found');
  }

  // Verify base version exists
  const { data: baseVer, error: verError } = await supabase
    .from('versions')
    .select('id')
    .eq('id', data.baseVersionId)
    .eq('document_id', documentId)
    .single();

  if (verError || !baseVer) {
    throw new NotFoundError('Base version not found');
  }

  const branchPayload = {
    document_id: documentId,
    tenant_id: doc.tenant_id,
    name: data.name,
    base_version_id: data.baseVersionId,
    head_version_id: data.baseVersionId,
    status: 'ACTIVE',
    created_by: userId,
  };

  const { data: branch, error: branchError } = await supabase
    .from('branches')
    .insert(branchPayload)
    .select()
    .single();

  if (branchError || !branch) {
    throw new AppError(`Failed to create branch: ${branchError?.message}`, 'BRANCH_CREATE_FAILED', 400);
  }

  // Audit event
  await logEvent({
    tenantId: doc.tenant_id,
    documentId: documentId,
    actorId: userId,
    actorType: 'human',
    eventType: 'BRANCH_CREATED',
    metadata: { branchId: branch.id, branchName: branch.name, baseVersionId: data.baseVersionId },
  });

  return {
    id: branch.id,
    documentId: branch.document_id,
    tenantId: branch.tenant_id,
    name: branch.name,
    headVersionId: branch.head_version_id,
    baseVersionId: branch.base_version_id,
    status: branch.status,
    createdBy: branch.created_by,
    createdAt: branch.created_at,
  };
}

export async function listBranches(
  _userId: string,
  documentId: string,
): Promise<Branch[]> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new AppError(`Failed to list branches: ${error.message}`, 'BRANCH_LIST_FAILED', 500);
  }

  return (data || []).map((b) => ({
    id: b.id,
    documentId: b.document_id,
    tenantId: b.tenant_id,
    name: b.name,
    headVersionId: b.head_version_id,
    baseVersionId: b.base_version_id,
    status: b.status,
    createdBy: b.created_by,
    createdAt: b.created_at,
  }));
}
